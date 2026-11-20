import React, { useRef, useState } from 'react';
import type {
    ExtractedIdentityDocumentData,
    IdentityDocumentCategory,
    UploadScopeType,
    UploadedIdentityDocument
} from '../../types/uploads';
import { uploadAndPersistDocument } from '../../services/documentUploadService';
import { toPersianDigits } from '../../services/bankLetterValidation';
import {
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    IdCard,
    Loader2,
    Sparkles,
    X
} from 'lucide-react';

interface IdentityQuickAutoFillBarProps {
    scopeType: UploadScopeType;
    scopeId: string;
    roleLabel?: string;
    nationalCode?: string;
    customerName?: string;
    phone?: string;
    onAutoFill: (
        extracted: ExtractedIdentityDocumentData,
        doc: UploadedIdentityDocument
    ) => string[];
}

export const IdentityQuickAutoFillBar: React.FC<IdentityQuickAutoFillBarProps> = ({
    scopeType,
    scopeId,
    roleLabel = 'متقاضی',
    nationalCode,
    customerName,
    phone,
    onAutoFill
}) => {
    const [activeCategory, setActiveCategory] = useState<IdentityDocumentCategory>('NATIONAL_CARD');
    const [isUploading, setIsUploading] = useState(false);
    const [statusBanner, setStatusBanner] = useState<{
        type: 'success' | 'warning' | 'info';
        message: string;
        extracted?: ExtractedIdentityDocumentData;
        filledFields?: string[];
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const triggerPicker = (cat: IdentityDocumentCategory) => {
        if (isUploading) return;
        setActiveCategory(cat);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.setAttribute('data-cat', cat);
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const chosenCategory =
            (e.target.getAttribute('data-cat') as IdentityDocumentCategory) || activeCategory;
        const subLabel =
            chosenCategory === 'SHENASNAMEH' ? 'صفحه اول (مشخصات اصلی)' : 'روی کارت ملی';

        setIsUploading(true);
        setStatusBanner(null);

        try {
            const doc = await uploadAndPersistDocument({
                file,
                scopeType,
                scopeId,
                category: chosenCategory,
                subLabel,
                pageNumber: 1,
                nationalCode,
                customerName,
                phone
            });

            if (doc.extractedData) {
                const filledFields = onAutoFill(doc.extractedData, doc);
                setStatusBanner({
                    type: 'success',
                    message:
                        filledFields.length > 0
                            ? `اطلاعات ${roleLabel} با موفقیت از ${chosenCategory === 'SHENASNAMEH' ? 'شناسنامه' : 'کارت ملی'} استخراج و در فرم تکمیل شد.`
                            : `اطلاعات مدرک دریافت و در پرونده ذخیره شد.`,
                    extracted: doc.extractedData,
                    filledFields
                });
            } else if (doc.syncStatus === 'UPLOADED') {
                setStatusBanner({
                    type: 'info',
                    message: `تصویر مدرک با موفقیت آپلود و در بخش «مدارک هویتی» ذخیره شد، اما پاسخ JSON استخراج مشخصات از سرور دریافت نشد.`
                });
            } else {
                setStatusBanner({
                    type: 'warning',
                    message:
                        doc.lastError ||
                        'به دلیل خطای ارتباط با سرور، تصویر در حافظه محلی ذخیره شد و از تب مدارک هویتی قابل ارسال مجدد است.'
                });
            }
        } catch (err: unknown) {
            setStatusBanner({
                type: 'warning',
                message: err instanceof Error ? err.message : 'خطا در پردازش فایل انتخاب‌شده'
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800/70 bg-gradient-to-l from-sky-50/90 via-white to-indigo-50/70 dark:from-sky-950/30 dark:via-slate-900 dark:to-indigo-950/20 p-3 space-y-2.5">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileSelected}
            />

            <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                    </span>
                    <div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                            تکمیل خودکار مشخصات {roleLabel} با تصویر کارت ملی یا شناسنامه
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            {isUploading
                                ? 'در حال ارسال تصویر و استخراج هوشمند اطلاعات هویتی...'
                                : 'با بارگذاری کارت ملی یا شناسنامه، مشخصات هویتی به‌صورت خودکار در فیلدهای فرم پر و مدرک نیز ذخیره می‌شود.'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => triggerPicker('NATIONAL_CARD')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                        <IdCard className="w-4 h-4" />
                        <span>آپلود کارت ملی</span>
                    </button>
                    <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => triggerPicker('SHENASNAMEH')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>آپلود شناسنامه</span>
                    </button>
                </div>
            </div>

            {statusBanner && (
                <div
                    className={`rounded-xl border p-2.5 text-[11px] flex items-start justify-between gap-2 ${
                        statusBanner.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : statusBanner.type === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                >
                    <div className="space-y-1">
                        <div className="font-black flex items-center gap-1.5">
                            {statusBanner.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>{statusBanner.message}</span>
                        </div>

                        {statusBanner.extracted && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-emerald-800 dark:text-emerald-300 pr-5">
                                {statusBanner.extracted.fullName && (
                                    <span>
                                        نام: <strong>{statusBanner.extracted.fullName}</strong>
                                    </span>
                                )}
                                {statusBanner.extracted.nationalId && (
                                    <span>
                                        کد ملی: <strong className="font-mono">{toPersianDigits(statusBanner.extracted.nationalId)}</strong>
                                    </span>
                                )}
                                {statusBanner.extracted.shenasnameNumber && (
                                    <span>
                                        شماره شناسنامه: <strong className="font-mono">{toPersianDigits(statusBanner.extracted.shenasnameNumber)}</strong>
                                    </span>
                                )}
                                {statusBanner.extracted.fatherName && (
                                    <span>
                                        نام پدر: <strong>{statusBanner.extracted.fatherName}</strong>
                                    </span>
                                )}
                                {statusBanner.extracted.birthDateSolar && (
                                    <span>
                                        تاریخ تولد: <strong className="font-mono">{toPersianDigits(statusBanner.extracted.birthDateSolar)}</strong>
                                    </span>
                                )}
                                {(statusBanner.extracted.issueCity || statusBanner.extracted.birthCity) && (
                                    <span>
                                        محل تولد/صدور: <strong>{statusBanner.extracted.issueCity || statusBanner.extracted.birthCity}</strong>
                                    </span>
                                )}
                            </div>
                        )}

                        {statusBanner.filledFields && statusBanner.filledFields.length > 0 && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 pr-5">
                                فیلدهای تکمیل‌شده: {statusBanner.filledFields.join('، ')}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setStatusBanner(null)}
                        className="p-0.5 rounded hover:bg-black/5 cursor-pointer shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};
