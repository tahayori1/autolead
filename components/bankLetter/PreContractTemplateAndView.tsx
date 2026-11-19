import React, { useState } from 'react';
import type { PreContractForm, DocumentPaperSize } from '../../types/bankLetter';
import {
    validateIranianNationalCode,
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from '../../services/bankLetterValidation';
import { exportPreContractToWord } from '../../services/wordExportService';
import { printOfficialDocument } from '../../services/documentPrintService';
import { PaginatedDocumentSheet, PaperSizeSelector } from './PaginatedDocumentSheet';
import { HtmlPrintPreviewModal } from './HtmlPrintPreviewModal';
import {
    FileSignature,
    User,
    Car,
    Check,
    AlertTriangle,
    Copy,
    Printer,
    FileDown,
    Loader2,
    Scale,
    Calendar,
    Banknote,
    Eye
} from 'lucide-react';

const COMMON_CARS = [
    'KMC eagle', 'KMC J7', 'KMC T8', 'KMC T9', 'KMC X5', 'KMC A5', 'BAC X3 pro', 'JAC J4', 'JAC S5', 'JAC S3'
];
const COMMON_COLORS = ['سفید', 'مشکی', 'خاکستری طوسی', 'قهوه‌ای تیتانیوم', 'سربی', 'آبی متالیک', 'قرمز'];

interface PreContractFillableTemplateProps {
    form: PreContractForm;
    onChange: (updates: Partial<PreContractForm>) => void;
}

export const PreContractFillableTemplate: React.FC<PreContractFillableTemplateProps> = ({ form, onChange }) => {
    const nationalCodeVal = validateIranianNationalCode(form.buyerNationalCode);

    const handlePriceChange = (field: 'totalPriceRials' | 'prepaymentRials', rawVal: string) => {
        const digits = rawVal.replace(/\D/g, '');
        onChange({ [field]: parseInt(digits, 10) || 0 });
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                        <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            تکمیل فرم پیش قرارداد
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            مشخصات متقاضی، خودرو، ثمن معامله و مبلغ پیش‌پرداخت را وارد نمایید؛ اعتبارسنجی کد ملی به صورت زنده انجام می‌شود.
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-bold">
                    نمایندگی ۲۶۰۶ حسینی
                </span>
            </div>

            {/* Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">شماره پیش‌قرارداد:</label>
                    <input
                        type="text"
                        value={form.contractNumber}
                        onChange={(e) => onChange({ contractNumber: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاریخ تنظیم:</label>
                    <input
                        type="text"
                        value={form.contractDate}
                        onChange={(e) => onChange({ contractDate: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                </div>
            </div>

            {/* Buyer Information */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-violet-600" />
                    <span>مشخصات خریدار</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">عنوان:</label>
                        <select
                            value={form.buyerTitle}
                            onChange={(e) => onChange({ buyerTitle: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        >
                            <option value="آقای">آقای</option>
                            <option value="خانم">خانم</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام و نام خانوادگی خریدار:</label>
                        <input
                            type="text"
                            placeholder="مثلاً: علی رضایی"
                            value={form.buyerName}
                            onChange={(e) => onChange({ buyerName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام پدر (فرزند):</label>
                        <input
                            type="text"
                            placeholder="نام پدر"
                            value={form.buyerFatherName}
                            onChange={(e) => onChange({ buyerFatherName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد ملی (۱۰ رقمی):</span>
                            {form.buyerNationalCode.length > 0 && (
                                nationalCodeVal.isValid ? (
                                    <span className="text-emerald-600 flex items-center gap-0.5 text-[10px]"><Check className="w-3 h-3" /> معتبر</span>
                                ) : (
                                    <span className="text-amber-600 flex items-center gap-0.5 text-[10px]"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>
                                )
                            )}
                        </label>
                        <input
                            type="text"
                            maxLength={10}
                            dir="ltr"
                            placeholder="2290000000"
                            value={form.buyerNationalCode}
                            onChange={(e) => onChange({ buyerNationalCode: e.target.value.replace(/\D/g, '') })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-violet-600" />
                    <span>مشخصات خودروی درخواستی</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع / مدل خودرو:</label>
                        <input
                            type="text"
                            value={form.carModel}
                            onChange={(e) => onChange({ carModel: e.target.value })}
                            placeholder="مثلاً: KMC J7"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {COMMON_CARS.slice(0, 5).map(c => (
                                <button key={c} type="button" onClick={() => onChange({ carModel: c })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">سال ساخت (مدل):</label>
                        <input
                            type="text"
                            value={form.modelYear}
                            onChange={(e) => onChange({ modelYear: e.target.value })}
                            placeholder="1405"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">رنگ خودرو:</label>
                        <input
                            type="text"
                            value={form.color}
                            onChange={(e) => onChange({ color: e.target.value })}
                            placeholder="سفید"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {COMMON_COLORS.slice(0, 4).map(col => (
                                <button key={col} type="button" onClick={() => onChange({ color: col })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>اطلاعات مالی و تعهدات پرداخت</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ثمن مورد معامله (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.totalPriceRials > 0 ? formatCurrencyWithCommas(form.totalPriceRials) : ''}
                            onChange={(e) => handlePriceChange('totalPriceRials', e.target.value)}
                            placeholder="مثلاً 15,000,000,000"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                        {form.totalPriceRials > 0 && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                                {numberToPersianWords(form.totalPriceRials)} ریال
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مبلغ پیش‌پرداخت همزمان (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.prepaymentRials > 0 ? formatCurrencyWithCommas(form.prepaymentRials) : ''}
                            onChange={(e) => handlePriceChange('prepaymentRials', e.target.value)}
                            placeholder="مثلاً 5,000,000,000"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                        {form.prepaymentRials > 0 && (
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-1">
                                {numberToPersianWords(form.prepaymentRials)} ریال
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span>تاریخ پرداخت الباقی ثمن معامله:</span>
                        </label>
                        <input
                            type="text"
                            value={form.remainingPaymentDate}
                            onChange={(e) => onChange({ remainingPaymentDate: e.target.value })}
                            placeholder="مثلاً: 1405/07/15"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PreContractOfficialViewProps {
    form: PreContractForm;
    onCopyText: () => void;
    isCopied: boolean;
    paperSize?: DocumentPaperSize;
    onPaperSizeChange?: (size: DocumentPaperSize) => void;
}

export const PreContractOfficialView: React.FC<PreContractOfficialViewProps> = ({
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
            { type: 'PRE_CONTRACT', data: form },
            {
                title: `فرم پیش قرارداد - ${form.buyerName || 'مشتری'}`,
                documentType: 'PRE_CONTRACT',
                paperSize
            }
        );
    };

    const handleExportWord = async () => {
        try {
            setIsExportingWord(true);
            await exportPreContractToWord(form, paperSize);
        } catch (err) {
            console.error('Word export error:', err);
        } finally {
            setIsExportingWord(false);
        }
    };

    const totalFormatted = form.totalPriceRials > 0 ? formatCurrencyWithCommas(form.totalPriceRials) : '...............................';
    const totalWords = form.totalPriceRials > 0 ? numberToPersianWords(form.totalPriceRials) : '';
    const prepayFormatted = form.prepaymentRials > 0 ? formatCurrencyWithCommas(form.prepaymentRials) : '................................';
    const prepayWords = form.prepaymentRials > 0 ? numberToPersianWords(form.prepaymentRials) : '';

    return (
        <div className="space-y-4" dir="rtl">
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            پیش‌نمایش رسمی فرم پیش قرارداد
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
                        <span>{isCopied ? 'متن پیش قرارداد کپی شد!' : 'کپی متن کامل'}</span>
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
                id="printable-pre-contract"
                paperSize={paperSize}
                onPageCountChange={setPageCount}
                watermark={<Scale className="w-[420px] h-[420px] text-slate-900" />}
                footer={
                    <>
                        <span>شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)</span>
                        <span>تلفن: ۰۷۱۹۱۶۹۰۹۰۶</span>
                    </>
                }
            >
                {/* Top Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-6 avoid-break">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-600 block">شرکت تضامنی حسینی خودرو شیراز</span>
                            <span className="text-[10px] text-slate-500">نمایندگی رسمی کرمان موتور - کد ۲۶۰۶</span>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-800 text-sm mb-1">بسمه تعالی</div>
                            <h1 className="text-xl font-black text-slate-900 tracking-wide border-b-2 border-violet-600 pb-1 inline-block">
                                فرم پیش قرارداد
                            </h1>
                        </div>
                        <div className="text-left text-[11px] space-y-1 font-mono text-slate-700">
                            <div><span className="font-sans font-bold text-slate-500 ml-1">شماره:</span>{toPersianDigits(form.contractNumber || '1405/PRE-1001')}</div>
                            <div><span className="font-sans font-bold text-slate-500 ml-1">تاریخ:</span>{toPersianDigits(form.contractDate || '1405/06/22')}</div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className={`space-y-5 text-slate-900 text-justify doc-body-text ${paperSize === 'A5' ? 'text-xs leading-[2.05]' : 'text-sm leading-[2.5]'}`}>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 avoid-break">
                        <div className="font-black text-slate-900 mb-2">مشخصات خریدار:</div>
                        <p>
                            اینجانب <span className="font-bold text-blue-900">{form.buyerTitle || 'خانم / آقای'} {form.buyerName || '.................................'}</span>{' '}
                            فرزند <span className="font-bold">{form.buyerFatherName || '............................'}</span>{' '}
                            به کدملی <span className="font-bold font-mono text-blue-900">{toPersianDigits(form.buyerNationalCode) || '.........................'}</span>{' '}
                            متقاضی خرید یک دستگاه خودرو <span className="font-bold text-blue-900">{form.carModel || '...............................'}</span>{' '}
                            مدل <span className="font-bold font-mono">{toPersianDigits(form.modelYear) || '..................'}</span>{' '}
                            رنگ <span className="font-bold">{form.color || '................'}</span>{' '}
                            در نمایندگی ۲۶۰۶ حسینی می‌باشم.
                        </p>
                    </div>

                    <div className="space-y-4 pr-2">
                        <p>
                            - ثمن مورد معامله به مبلغ <span className="font-black text-emerald-800 font-mono">{toPersianDigits(totalFormatted)} ریال</span>
                            {totalWords && <span className="font-semibold text-slate-700"> ({totalWords} ریال)</span>} مورد تایید اینجانب می‌باشد.
                        </p>
                        <p>
                            - متعهد می‌گردم همزمان با این درخواست، مبلغ <span className="font-black text-blue-900 font-mono">{toPersianDigits(prepayFormatted)} ریال</span>
                            {prepayWords && <span className="font-semibold text-slate-700"> ({prepayWords} ریال)</span>} به عنوان پیش‌پرداخت به حساب کرمان موتور ۲۶۰۶ حسینی واریز نمایم.
                        </p>
                        <p>
                            - الباقی ثمن معامله مورخ <span className="font-black font-mono text-amber-800">{toPersianDigits(form.remainingPaymentDate) || '..........................'}</span> پرداخت می‌گردد. در صورت عدم پرداخت مابقی وجه در موعد مقرر معامله به صورت یکطرفه از سوی فروشنده فسخ خواهد شد.
                        </p>
                        <p className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                            - چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت حسینی خودرو شیراز مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت ۳۰ روز به اینجانب اعاده نماید.
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="avoid-break signature-box mt-12 pt-6 border-t-2 border-slate-800">
                    <div className="grid grid-cols-2 gap-8 text-center">
                        <div className="space-y-10 p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                            <span className="font-black text-sm text-slate-800 block">نام و امضای خریدار</span>
                            <span className="text-xs text-slate-600 block font-bold">
                                {form.buyerTitle || ''} {form.buyerName || '........................................'}
                            </span>
                        </div>
                        <div className="space-y-10 p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                            <span className="font-black text-sm text-slate-800 block">اثر انگشت</span>
                            <span className="text-[11px] text-slate-400 block">[ محل ثبت اثر انگشت متقاضی ]</span>
                        </div>
                    </div>
                </div>
            </PaginatedDocumentSheet>

            <HtmlPrintPreviewModal
                isOpen={isHtmlPreviewOpen}
                onClose={() => setIsHtmlPreviewOpen(false)}
                payload={{ type: 'PRE_CONTRACT', data: form }}
                paperSize={paperSize}
                onPaperSizeChange={handlePaperSizeChange}
                documentTitle={`فرم پیش قرارداد - ${form.buyerName || 'خریدار'}`}
            />
        </div>
    );
};
