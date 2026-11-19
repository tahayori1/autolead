import React, { useState } from 'react';
import type { RemittanceApprovalForm, DocumentPaperSize } from '../../types/bankLetter';
import {
    validateIranianNationalCode,
    validateIranianMobile,
    formatCurrencyWithCommas,
    toPersianDigits
} from '../../services/bankLetterValidation';
import { exportRemittanceApprovalToWord } from '../../services/wordExportService';
import { printOfficialDocument } from '../../services/documentPrintService';
import { PaginatedDocumentSheet, PaperSizeSelector } from './PaginatedDocumentSheet';
import { HtmlPrintPreviewModal } from './HtmlPrintPreviewModal';
import {
    ClipboardCheck,
    Car,
    User,
    Calculator,
    Briefcase,
    ShieldCheck,
    Check,
    AlertTriangle,
    Copy,
    Printer,
    FileDown,
    Loader2,
    Eye
} from 'lucide-react';

const COMMON_CARS = [
    'KMC eagle', 'KMC J7', 'KMC T8', 'KMC T9', 'KMC X5', 'KMC A5', 'BAC X3 pro', 'JAC J4', 'JAC S5', 'JAC S3'
];
const COMMON_COLORS = ['سفید', 'مشکی', 'خاکستری طوسی', 'قهوه‌ای تیتانیوم', 'سربی', 'آبی متالیک', 'قرمز'];

interface RemittanceApprovalFillableTemplateProps {
    form: RemittanceApprovalForm;
    onChange: (updates: Partial<RemittanceApprovalForm>) => void;
}

export const RemittanceApprovalFillableTemplate: React.FC<RemittanceApprovalFillableTemplateProps> = ({ form, onChange }) => {
    const nationalCodeVal = validateIranianNationalCode(form.customerNationalCode);
    const mobileVal = validateIranianMobile(form.customerPhone);

    const handleFinancialChange = (field: 'totalAmountRials' | 'paidAmountRials' | 'remainingAmountRials', rawVal: string) => {
        const num = parseInt(rawVal.replace(/\D/g, ''), 10) || 0;
        const updates: Partial<RemittanceApprovalForm> = { [field]: num };
        if (field === 'totalAmountRials') {
            updates.remainingAmountRials = Math.max(0, num - (form.paidAmountRials || 0));
        } else if (field === 'paidAmountRials') {
            updates.remainingAmountRials = Math.max(0, (form.totalAmountRials || 0) - num);
        }
        onChange(updates);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            تکمیل فرم تایید نهایی حواله – نمایندگی حسینی خودرو شیراز
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            چک‌لیست پنج‌مرحله‌ای تایید خودرو، مشتری، حسابداری، فروش و مدیریت پیش از تحویل حواله
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
                    تایید ۳ واحد (حسابداری / فروش / مدیریت)
                </span>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">شماره فرم:</label>
                    <input
                        type="text"
                        value={form.formNumber}
                        onChange={(e) => onChange({ formNumber: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاریخ فرم:</label>
                    <input
                        type="text"
                        value={form.formDate}
                        onChange={(e) => onChange({ formDate: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                </div>
            </div>

            {/* 1. مشخصات خودرو */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>۱. مشخصات خودرو</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع خودرو:</label>
                        <input
                            type="text"
                            value={form.carModel}
                            onChange={(e) => onChange({ carModel: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {COMMON_CARS.slice(0, 5).map(c => (
                                <button key={c} type="button" onClick={() => onChange({ carModel: c })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">رنگ:</label>
                        <input
                            type="text"
                            value={form.color}
                            onChange={(e) => onChange({ color: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {COMMON_COLORS.slice(0, 4).map(col => (
                                <button key={col} type="button" onClick={() => onChange({ color: col })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">زمان تحویل:</label>
                        <input
                            type="text"
                            value={form.deliveryTime}
                            onChange={(e) => onChange({ deliveryTime: e.target.value })}
                            placeholder="مثلاً: فوری / ۱۴۰۵/۰۸/۰۱"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* 2. اطلاعات مشتری */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>۲. اطلاعات مشتری</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام و نام خانوادگی:</label>
                        <input
                            type="text"
                            value={form.customerName}
                            onChange={(e) => onChange({ customerName: e.target.value })}
                            placeholder="نام کامل مشتری"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد ملی:</span>
                            {form.customerNationalCode.length > 0 && (
                                nationalCodeVal.isValid
                                    ? <span className="text-emerald-600 flex items-center gap-0.5 text-[10px]"><Check className="w-3 h-3" /> معتبر</span>
                                    : <span className="text-amber-600 flex items-center gap-0.5 text-[10px]"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>
                            )}
                        </label>
                        <input
                            type="text"
                            maxLength={10}
                            dir="ltr"
                            value={form.customerNationalCode}
                            onChange={(e) => onChange({ customerNationalCode: e.target.value.replace(/\D/g, '') })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>شماره تماس:</span>
                            {form.customerPhone.length > 0 && (
                                mobileVal.isValid
                                    ? <span className="text-emerald-600 flex items-center gap-0.5 text-[10px]"><Check className="w-3 h-3" /> معتبر</span>
                                    : <span className="text-amber-600 flex items-center gap-0.5 text-[10px]"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>
                            )}
                        </label>
                        <input
                            type="text"
                            maxLength={11}
                            dir="ltr"
                            value={form.customerPhone}
                            onChange={(e) => onChange({ customerPhone: e.target.value.replace(/\D/g, '') })}
                            placeholder="09170000000"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* 3. کنترل وضعیت مالی (حسابداری) */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    <span>۳. کنترل وضعیت مالی (مسئولیت کامل با حسابداری)</span>
                </h4>
                <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.accCheckNoDebt} onChange={(e) => onChange({ accCheckNoDebt: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                        <span>هیچگونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.accCheckMatched} onChange={(e) => onChange({ accCheckMatched: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                        <span>کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.accCheckClear} onChange={(e) => onChange({ accCheckClear: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                        <span>حواله خودرو از نظر مالی بلامانع است</span>
                    </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مبلغ کل (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.totalAmountRials > 0 ? formatCurrencyWithCommas(form.totalAmountRials) : ''}
                            onChange={(e) => handleFinancialChange('totalAmountRials', e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مبلغ واریزی (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.paidAmountRials > 0 ? formatCurrencyWithCommas(form.paidAmountRials) : ''}
                            onChange={(e) => handleFinancialChange('paidAmountRials', e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مانده حساب (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.remainingAmountRials > 0 ? formatCurrencyWithCommas(form.remainingAmountRials) : '0'}
                            onChange={(e) => handleFinancialChange('remainingAmountRials', e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام مسئول حسابداری:</label>
                        <input
                            type="text"
                            value={form.accountingManagerName}
                            onChange={(e) => onChange({ accountingManagerName: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">تاریخ تایید حسابداری:</label>
                        <input
                            type="text"
                            value={form.accountingDate}
                            onChange={(e) => onChange({ accountingDate: e.target.value })}
                            placeholder="1405/06/22"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* 4. کنترل وضعیت فروش */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>۴. کنترل وضعیت فروش (مسئولیت کامل با مسئول فروش)</span>
                </h4>
                <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.salesCheckCorrect} onChange={(e) => onChange({ salesCheckCorrect: e.target.checked })} className="w-4 h-4 rounded accent-amber-600" />
                        <span>اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.salesCheckInvoice} onChange={(e) => onChange({ salesCheckInvoice: e.target.checked })} className="w-4 h-4 rounded accent-amber-600" />
                        <span>مبلغ فاکتور، تخفیف‌ها، شرایط فروش و مانده حساب کنترل شد</span>
                    </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام مسئول فروش:</label>
                        <input
                            type="text"
                            value={form.salesManagerName}
                            onChange={(e) => onChange({ salesManagerName: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">تاریخ تایید فروش:</label>
                        <input
                            type="text"
                            value={form.salesDate}
                            onChange={(e) => onChange({ salesDate: e.target.value })}
                            placeholder="1405/06/22"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">توضیحات:</label>
                    <textarea
                        rows={2}
                        value={form.salesNotes}
                        onChange={(e) => onChange({ salesNotes: e.target.value })}
                        placeholder="توضیحات تکمیلی واحد فروش..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                </div>
            </div>

            {/* 5. مدیریت تأیید می‌کند */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>۵. مدیریت تأیید می‌کند</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                        <input type="checkbox" checked={form.mgmtCheckSignatures} onChange={(e) => onChange({ mgmtCheckSignatures: e.target.checked })} className="w-4 h-4 rounded accent-emerald-600" />
                        <span>تمامی امضاها کنترل</span>
                    </label>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مسئولیت فروش با:</label>
                        <input
                            type="text"
                            value={form.salesResponsibilityWith}
                            onChange={(e) => onChange({ salesResponsibilityWith: e.target.value })}
                            placeholder="نام کارشناس / مسئول مربوطه"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface RemittanceApprovalOfficialViewProps {
    form: RemittanceApprovalForm;
    onCopyText: () => void;
    isCopied: boolean;
    paperSize?: DocumentPaperSize;
    onPaperSizeChange?: (size: DocumentPaperSize) => void;
}

export const RemittanceApprovalOfficialView: React.FC<RemittanceApprovalOfficialViewProps> = ({
    form,
    onCopyText,
    isCopied,
    paperSize: controlledPaperSize,
    onPaperSizeChange
}) => {
    const [internalPaperSize, setInternalPaperSize] = useState<DocumentPaperSize>('A4');
    const [pageCount, setPageCount] = useState(1);
    const [isExportingWord, setIsExportingWord] = useState(false);
    const [isHtmlPreviewOpen, setIsHtmlPreviewOpen] = useState(false);

    const paperSize = controlledPaperSize ?? internalPaperSize;
    const handlePaperSizeChange = (next: DocumentPaperSize) => {
        setInternalPaperSize(next);
        onPaperSizeChange?.(next);
    };

    const handlePrint = async () => {
        await printOfficialDocument(
            { type: 'REMITTANCE_APPROVAL', data: form },
            {
                title: `فرم تایید نهایی حواله - ${form.customerName || 'مشتری'}`,
                documentType: 'REMITTANCE_APPROVAL',
                paperSize
            }
        );
    };

    const handleExportWord = async () => {
        try {
            setIsExportingWord(true);
            await exportRemittanceApprovalToWord(form, paperSize);
        } catch (err) {
            console.error('Word export error:', err);
        } finally {
            setIsExportingWord(false);
        }
    };

    const totalStr = form.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.totalAmountRials))} ریال` : '......................................';
    const paidStr = form.paidAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.paidAmountRials))} ریال` : '................................';
    const remStr = form.remainingAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(form.remainingAmountRials))} ریال`
        : (form.totalAmountRials > 0 && form.paidAmountRials >= form.totalAmountRials ? '۰ ریال (تسویه کامل)' : '.................................');

    return (
        <div className="space-y-4" dir="rtl">
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            پیش‌نمایش رسمی فرم تایید نهایی حواله
                        </span>
                    </div>
                    <PaperSizeSelector
                        paperSize={paperSize}
                        onChange={handlePaperSizeChange}
                        pageCount={pageCount}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onCopyText}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isCopied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'متن فرم کپی شد!' : 'کپی متن کامل'}</span>
                    </button>
                    <button
                        onClick={handleExportWord}
                        disabled={isExportingWord}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                    >
                        {isExportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                        <span>خروجی Word ({paperSize})</span>
                    </button>
                    <button
                        onClick={() => setIsHtmlPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                        title="باز کردن پیش‌نمایش دقیق HTML + CSS راست‌به‌چپ برای چاپ"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>پیش‌نمایش چاپ (HTML)</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ رسمی ({paperSize}) / PDF</span>
                    </button>
                </div>
            </div>

            {/* Paginated Official Sheet */}
            <PaginatedDocumentSheet
                id="printable-remittance-approval"
                paperSize={paperSize}
                onPageCountChange={setPageCount}
                footer={
                    <>
                        <span>شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)</span>
                        <span>تلفن: ۰۷۱۹۱۶۹۰۹۰۶</span>
                    </>
                }
            >
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5 avoid-break">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-600 block">شرکت تضامنی حسینی خودرو شیراز</span>
                            <span className="text-[10px] text-slate-500">نمایندگی رسمی کرمان موتور - کد ۲۶۰۶</span>
                        </div>
                        <div className="text-center">
                            <h1 className={`${paperSize === 'A5' ? 'text-sm' : 'text-lg'} font-black text-slate-900 border-b-2 border-emerald-600 pb-1 inline-block`}>
                                فرم تایید نهایی حواله – نمایندگی حسینی خودرو شیراز
                            </h1>
                        </div>
                        <div className="text-left text-[11px] space-y-1 font-mono text-slate-700">
                            <div><span className="font-sans font-bold text-slate-500 ml-1">شماره:</span>{toPersianDigits(form.formNumber || '1405/REM-1001')}</div>
                            <div><span className="font-sans font-bold text-slate-500 ml-1">تاریخ:</span>{toPersianDigits(form.formDate || '1405/06/22')}</div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className={`space-y-4 text-slate-900 doc-body-text ${paperSize === 'A5' ? 'text-[11px] leading-[1.85]' : 'text-xs sm:text-[13px] leading-[2]'}`}>
                    {/* 1 & 2 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 avoid-break">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="font-black text-slate-900 border-b border-slate-200 pb-1">۱. مشخصات خودرو:</div>
                            <div><span className="font-bold text-slate-600">نوع خودرو: </span><span className="font-bold text-blue-900">{form.carModel || '……………………………………'}</span></div>
                            <div><span className="font-bold text-slate-600">رنگ: </span><span className="font-bold">{form.color || '………………………………………'}</span></div>
                            <div><span className="font-bold text-slate-600">زمان تحویل: </span><span className="font-bold">{toPersianDigits(form.deliveryTime) || '………………………………'}</span></div>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="font-black text-slate-900 border-b border-slate-200 pb-1">۲. اطلاعات مشتری:</div>
                            <div><span className="font-bold text-slate-600">نام و نام خانوادگی: </span><span className="font-bold text-blue-900">{form.customerName || '.............................'}</span></div>
                            <div><span className="font-bold text-slate-600">کدملی: </span><span className="font-bold font-mono">{toPersianDigits(form.customerNationalCode) || '......................................'}</span></div>
                            <div><span className="font-bold text-slate-600">شماره تماس: </span><span className="font-bold font-mono">{toPersianDigits(form.customerPhone) || '.................................'}</span></div>
                        </div>
                    </div>

                    {/* 3. Accounting */}
                    <div className="p-4 rounded-xl border-2 border-slate-300 space-y-2.5 avoid-break">
                        <div className="font-black text-slate-900 text-sm">۳. کنترل وضعیت مالی (مسئولیت کامل با حسابداری):</div>
                        <div className="space-y-1.5 pr-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.accCheckNoDebt ? '✓' : ''}</span>
                                <span>هیچگونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.accCheckMatched ? '✓' : ''}</span>
                                <span>کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.accCheckClear ? '✓' : ''}</span>
                                <span>حواله خودرو از نظر مالی بلامانع است</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-bold">
                            <div>مبلغ کل: <span className="font-mono text-slate-900">{totalStr}</span></div>
                            <div>مبلغ واریزی: <span className="font-mono text-emerald-800">{paidStr}</span></div>
                            <div>مانده حساب: <span className="font-mono text-amber-800">{remStr}</span></div>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                            <div><span className="font-bold">نام مسئول حسابداری: </span>{form.accountingManagerName || '....................'}</div>
                            <div><span className="font-bold">امضا و تاریخ: </span>{toPersianDigits(form.accountingDate) || '....................'}</div>
                        </div>
                    </div>

                    {/* 4. Sales */}
                    <div className="p-4 rounded-xl border-2 border-slate-300 space-y-2.5 avoid-break">
                        <div className="font-black text-slate-900 text-sm">۴. کنترل وضعیت فروش (مسئولیت کامل با مسئول فروش):</div>
                        <div className="space-y-1.5 pr-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.salesCheckCorrect ? '✓' : ''}</span>
                                <span>اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.salesCheckInvoice ? '✓' : ''}</span>
                                <span>مبلغ فاکتور، تخفیف‌ها، شرایط فروش و مانده حساب کنترل شد</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <div><span className="font-bold">نام مسئول فروش: </span>{form.salesManagerName || '...........................'}</div>
                            <div><span className="font-bold">امضا و تاریخ: </span>{toPersianDigits(form.salesDate) || '....................'}</div>
                        </div>
                        <div className="pt-1">
                            <span className="font-bold">توضیحات: </span>{form.salesNotes || '..............................................'}
                        </div>
                    </div>

                    {/* 5. Management */}
                    <div className="p-4 rounded-xl border-2 border-slate-800 bg-slate-50/70 space-y-3 avoid-break">
                        <div className="font-black text-slate-900 text-sm">۵. مدیریت تأیید می‌کند:</div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded text-[11px] font-bold">{form.mgmtCheckSignatures ? '✓' : ''}</span>
                            <span className="font-bold">تمامی امضاها کنترل</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <div><span className="font-bold">مسئولیت فروش با: </span><span className="font-black text-blue-900">{form.salesResponsibilityWith || '......................................'}</span></div>
                            <div className="text-slate-600 font-bold">مهر و امضای مدیریت: ....................</div>
                        </div>
                    </div>
                </div>
            </PaginatedDocumentSheet>

            <HtmlPrintPreviewModal
                isOpen={isHtmlPreviewOpen}
                onClose={() => setIsHtmlPreviewOpen(false)}
                payload={{ type: 'REMITTANCE_APPROVAL', data: form }}
                paperSize={paperSize}
                onPaperSizeChange={handlePaperSizeChange}
                documentTitle={`فرم تایید نهایی حواله - ${form.customerName || 'مشتری'}`}
            />
        </div>
    );
};
