import React, { useState, useRef } from 'react';
import { 
    X, 
    Upload, 
    FileJson, 
    CheckCircle2, 
    AlertTriangle, 
    Info, 
    Database, 
    Layers, 
    Calendar, 
    Car,
    SlidersHorizontal,
    Plus,
    RefreshCw
} from 'lucide-react';
import { CommissionPeriod, CommissionDeal, CarYardItem, CommissionSettings } from '../../types';
import { importCommissionJSONData } from '../../services/commissionService';

interface CommissionJsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (result: {
        periods: CommissionPeriod[];
        deals: CommissionDeal[];
        yard: CarYardItem[];
        settings?: CommissionSettings;
        activePeriodId?: string;
    }) => void;
}

export const CommissionJsonModal: React.FC<CommissionJsonModalProps> = ({
    isOpen,
    onClose,
    onImportSuccess
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [jsonPreview, setJsonPreview] = useState<{
        version?: string;
        exportedAt?: string;
        periodsCount: number;
        dealsCount: number;
        yardCount: number;
        hasSettings: boolean;
        sampleDeal?: CommissionDeal;
        rawObject: any;
    } | null>(null);

    const [importMode, setImportMode] = useState<'REPLACE_ALL' | 'APPEND'>('REPLACE_ALL');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setErrorMessage(null);
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);

                let periods: CommissionPeriod[] = [];
                let deals: CommissionDeal[] = [];
                let yard: CarYardItem[] = [];
                let hasSettings = false;

                if (Array.isArray(parsed)) {
                    deals = parsed;
                    const pIds = Array.from(new Set(deals.map(d => d.periodId).filter(Boolean)));
                    periods = pIds.map(id => ({ id, title: id }));
                } else if (parsed && typeof parsed === 'object') {
                    periods = Array.isArray(parsed.periods) ? parsed.periods : [];
                    deals = Array.isArray(parsed.deals) ? parsed.deals : [];
                    yard = Array.isArray(parsed.yardItems) ? parsed.yardItems : [];
                    hasSettings = !!parsed.settings;
                } else {
                    throw new Error('فرمت داده‌ها با ساختار استاندارد سیستم همخوانی ندارد.');
                }

                setJsonPreview({
                    version: parsed.version,
                    exportedAt: parsed.exportedAt,
                    periodsCount: periods.length,
                    dealsCount: deals.length,
                    yardCount: yard.length,
                    hasSettings,
                    sampleDeal: deals[0],
                    rawObject: parsed
                });
            } catch (err: any) {
                setErrorMessage(err.message || 'فایل انتخاب‌شده یک JSON معتبر نیست.');
                setJsonPreview(null);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleApplyImport = () => {
        if (!jsonPreview) return;
        setIsLoading(true);

        try {
            const result = importCommissionJSONData(jsonPreview.rawObject, importMode);

            if (result.success) {
                onImportSuccess({
                    periods: result.periods,
                    deals: result.deals,
                    yard: result.yard,
                    settings: result.settings,
                    activePeriodId: result.activePeriodId
                });
                onClose();
            } else {
                setErrorMessage(result.error || 'خطا در اعمال داده‌ها.');
            }
        } catch (e: any) {
            setErrorMessage(e.message || 'خطا در ثبت اطلاعات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <FileJson className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                                ورود داده‌ها از فایل JSON (پشتیبان)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                بازیابی کامل معاملات، دوره‌های مالی، درصدهای کمیسیون و وضعیت پارکینگ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-xs">
                    
                    {/* File Upload Box */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-2xl group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-black text-slate-800 dark:text-slate-200">
                            {file ? file.name : 'کلیک کنید یا فایل JSON را اینجا رها کنید'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            فرمت مجاز: فایل‌های خروجی گرفته شده با فرمت JSON.
                        </span>
                    </div>

                    {/* Error Box */}
                    {errorMessage && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="font-bold text-[11px] leading-5">{errorMessage}</div>
                        </div>
                    )}

                    {/* Preview summary */}
                    {jsonPreview && (
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    محتوای شناسایی‌شده در فایل
                                </span>
                                {jsonPreview.exportedAt && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        تاریخ استخراج: {new Date(jsonPreview.exportedAt).toLocaleDateString('fa-IR')}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
                                    <span className="text-[10px] text-slate-400 block mb-0.5">معاملات</span>
                                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                        {jsonPreview.dealsCount.toLocaleString('fa-IR')}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
                                    <span className="text-[10px] text-slate-400 block mb-0.5">دوره‌های مالی</span>
                                    <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                                        {jsonPreview.periodsCount.toLocaleString('fa-IR')}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
                                    <span className="text-[10px] text-slate-400 block mb-0.5">خودروهای پارکینگ</span>
                                    <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                                        {jsonPreview.yardCount.toLocaleString('fa-IR')}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
                                    <span className="text-[10px] text-slate-400 block mb-0.5">تنظیمات نرخ‌ها</span>
                                    <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                                        {jsonPreview.hasSettings ? 'شامل تنظیمات' : 'پیش‌فرض'}
                                    </span>
                                </div>
                            </div>

                            {/* Import mode strategy */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    روش اعمال داده‌ها در سیستم:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setImportMode('REPLACE_ALL')}
                                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                                            importMode === 'REPLACE_ALL'
                                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <RefreshCw className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                                        <div>
                                            <div className="font-black text-xs">جایگزینی کامل (Restore)</div>
                                            <div className="text-[10px] opacity-75 mt-0.5">پاکسازی داده‌های قبلی و جایگزینی کامل با محتوای این فایل</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportMode('APPEND')}
                                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                                            importMode === 'APPEND'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <Plus className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                                        <div>
                                            <div className="font-black text-xs">افزودن و ادغام (Merge)</div>
                                            <div className="text-[10px] opacity-75 mt-0.5">حفظ معاملات فعلی و اضافه کردن معاملات جدید این فایل</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        disabled={!jsonPreview || isLoading}
                        onClick={handleApplyImport}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                        <Database className="w-4 h-4" />
                        {isLoading ? 'در حال ثبت اطلاعات...' : 'بارگذاری و تایید فایل JSON'}
                    </button>
                </div>

            </div>
        </div>
    );
};
