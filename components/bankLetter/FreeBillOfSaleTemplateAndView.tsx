import React, { useState } from 'react';
import type { FreeBillOfSale, DocumentPaperSize } from '../../types/bankLetter';
import {
    validateIranianNationalCode,
    validateIranianPostalCode,
    validateIranianMobile,
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from '../../services/bankLetterValidation';
import { IranLicensePlateInput } from './IranLicensePlateInput';
import { exportFreeBillToWord } from '../../services/wordExportService';
import { printOfficialDocument } from '../../services/documentPrintService';
import { PaginatedDocumentSheet, PaperSizeSelector } from './PaginatedDocumentSheet';
import { HtmlPrintPreviewModal } from './HtmlPrintPreviewModal';
import {
    ScrollText,
    User,
    Car,
    Check,
    AlertTriangle,
    Copy,
    Printer,
    FileDown,
    Loader2,
    Scale,
    Banknote,
    FileText,
    Eye
} from 'lucide-react';

const COMMON_CARS = [
    'KMC eagle', 'KMC J7', 'KMC T8', 'KMC T9', 'KMC X5', 'KMC A5', 'BAC X3 pro', 'JAC J4', 'JAC S5', 'JAC S3'
];
const COMMON_COLORS = ['سفید', 'مشکی', 'خاکستری طوسی', 'قهوه‌ای تیتانیوم', 'سربی', 'آبی متالیک', 'قرمز'];

interface FreeBillOfSaleFillableTemplateProps {
    form: FreeBillOfSale;
    onChange: (updates: Partial<FreeBillOfSale>) => void;
}

export const FreeBillOfSaleFillableTemplate: React.FC<FreeBillOfSaleFillableTemplateProps> = ({ form, onChange }) => {
    const sellerNcVal = validateIranianNationalCode(form.sellerNationalCode);
    const sellerPcVal = validateIranianPostalCode(form.sellerPostalCode);
    const sellerMobVal = validateIranianMobile(form.sellerPhone);

    const buyerNcVal = validateIranianNationalCode(form.buyerNationalCode);
    const buyerPcVal = validateIranianPostalCode(form.buyerPostalCode);
    const buyerMobVal = validateIranianMobile(form.buyerPhone);

    const handleAmountChange = (raw: string) => {
        const num = parseInt(raw.replace(/\D/g, ''), 10) || 0;
        onChange({ totalAmountRials: num });
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        <ScrollText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            تکمیل قولنامه آزاد خودرو
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            مشخصات فروشنده، خریدار، خودرو (شماره بدنه و شهربانی)، ثمن معامله و مدارک تحویلی را تکمیل کنید.
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold">
                    مبایعه‌نامه قطعی خودرو
                </span>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">شماره قولنامه:</label>
                    <input
                        type="text"
                        value={form.contractNumber}
                        onChange={(e) => onChange({ contractNumber: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">تاریخ معامله:</label>
                    <input
                        type="text"
                        value={form.contractDate}
                        onChange={(e) => onChange({ contractDate: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ساعت معامله:</label>
                    <input
                        type="text"
                        value={form.transactionTime}
                        onChange={(e) => onChange({ transactionTime: e.target.value })}
                        placeholder="11:30"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                    />
                </div>
            </div>

            {/* Seller Info */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>مشخصات فروشنده</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">عنوان:</label>
                        <select value={form.sellerTitle} onChange={(e) => onChange({ sellerTitle: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white">
                            <option value="آقای">آقای</option>
                            <option value="خانم">خانم</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام و نام خانوادگی:</label>
                        <input type="text" value={form.sellerName} onChange={(e) => onChange({ sellerName: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">فرزند:</label>
                        <input type="text" value={form.sellerFatherName} onChange={(e) => onChange({ sellerFatherName: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">شماره شناسنامه:</label>
                        <input type="text" dir="ltr" value={form.sellerIdNumber} onChange={(e) => onChange({ sellerIdNumber: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">صادره از:</label>
                        <input type="text" value={form.sellerIssuePlace} onChange={(e) => onChange({ sellerIssuePlace: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد ملی:</span>
                            {form.sellerNationalCode.length > 0 && (sellerNcVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>)}
                        </label>
                        <input type="text" maxLength={10} dir="ltr" value={form.sellerNationalCode} onChange={(e) => onChange({ sellerNationalCode: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد پستی:</span>
                            {form.sellerPostalCode.length > 0 && (sellerPcVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> ۱۰ رقم</span>)}
                        </label>
                        <input type="text" maxLength={10} dir="ltr" value={form.sellerPostalCode} onChange={(e) => onChange({ sellerPostalCode: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>تلفن:</span>
                            {form.sellerPhone.length > 0 && (sellerMobVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>)}
                        </label>
                        <input type="text" maxLength={11} dir="ltr" value={form.sellerPhone} onChange={(e) => onChange({ sellerPhone: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">آدرس فروشنده:</label>
                    <input type="text" value={form.sellerAddress} onChange={(e) => onChange({ sellerAddress: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                </div>
            </div>

            {/* Buyer Info */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>مشخصات خریدار</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">عنوان:</label>
                        <select value={form.buyerTitle} onChange={(e) => onChange({ buyerTitle: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white">
                            <option value="آقای">آقای</option>
                            <option value="خانم">خانم</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نام و نام خانوادگی:</label>
                        <input type="text" value={form.buyerName} onChange={(e) => onChange({ buyerName: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">فرزند:</label>
                        <input type="text" value={form.buyerFatherName} onChange={(e) => onChange({ buyerFatherName: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">شماره شناسنامه:</label>
                        <input type="text" dir="ltr" value={form.buyerIdNumber} onChange={(e) => onChange({ buyerIdNumber: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">صادره از:</label>
                        <input type="text" value={form.buyerIssuePlace} onChange={(e) => onChange({ buyerIssuePlace: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد ملی:</span>
                            {form.buyerNationalCode.length > 0 && (buyerNcVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>)}
                        </label>
                        <input type="text" maxLength={10} dir="ltr" value={form.buyerNationalCode} onChange={(e) => onChange({ buyerNationalCode: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>کد پستی:</span>
                            {form.buyerPostalCode.length > 0 && (buyerPcVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> ۱۰ رقم</span>)}
                        </label>
                        <input type="text" maxLength={10} dir="ltr" value={form.buyerPostalCode} onChange={(e) => onChange({ buyerPostalCode: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span>تلفن:</span>
                            {form.buyerPhone.length > 0 && (buyerMobVal.isValid ? <span className="text-emerald-600 text-[10px] flex items-center gap-0.5"><Check className="w-3 h-3" /> معتبر</span> : <span className="text-amber-600 text-[10px] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> نامعتبر</span>)}
                        </label>
                        <input type="text" maxLength={11} dir="ltr" value={form.buyerPhone} onChange={(e) => onChange({ buyerPhone: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">آدرس خریدار:</label>
                    <input type="text" value={form.buyerAddress} onChange={(e) => onChange({ buyerAddress: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                </div>
            </div>

            {/* Subject of Transaction */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-teal-600" />
                    <span>مورد معامله</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع خودرو:</label>
                        <input type="text" value={form.carModel} onChange={(e) => onChange({ carModel: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                        <div className="flex flex-wrap gap-1 mt-1">
                            {COMMON_CARS.slice(0, 4).map(c => (
                                <button key={c} type="button" onClick={() => onChange({ carModel: c })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">{c}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">شماره بدنه (شاسی):</label>
                        <input type="text" dir="ltr" value={form.chassisNumber} onChange={(e) => onChange({ chassisNumber: e.target.value.toUpperCase() })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">رنگ:</label>
                        <input type="text" value={form.color} onChange={(e) => onChange({ color: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white" />
                        <div className="flex flex-wrap gap-1 mt-1">
                            {COMMON_COLORS.slice(0, 4).map(col => (
                                <button key={col} type="button" onClick={() => onChange({ color: col })} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">{col}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">شماره شهربانی (پلاک انتظامی):</label>
                    <IranLicensePlateInput value={form.plateNumber} onChange={(plate) => onChange({ plateNumber: plate })} />
                </div>
            </div>

            {/* Amount & Documents */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>مبلغ مورد معامله و مدارک تحویلی</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مبلغ مورد معامله (ریال):</label>
                        <input
                            type="text"
                            dir="ltr"
                            value={form.totalAmountRials > 0 ? formatCurrencyWithCommas(form.totalAmountRials) : ''}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 dark:text-white"
                        />
                        {form.totalAmountRials > 0 && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">{numberToPersianWords(form.totalAmountRials)} ریال</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">شرح نحوه پرداخت (اختیاری):</label>
                        <input
                            type="text"
                            value={form.totalAmountDescription}
                            onChange={(e) => onChange({ totalAmountDescription: e.target.value })}
                            placeholder="مثلاً: طی دو فقره چک و حواله ساتنا..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-teal-600" />
                        <span>مدارک تحویلی خودرو (اعم از ... تحویل خریدار گردید):</span>
                    </label>
                    <textarea
                        rows={2}
                        value={form.deliveredDocuments}
                        onChange={(e) => onChange({ deliveredDocuments: e.target.value })}
                        placeholder="مثلاً: برگ سبز، سند کمپانی، کارت خودرو، بیمه‌نامه، کارت سوخت و زاپاس..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                </div>
            </div>
        </div>
    );
};

interface FreeBillOfSaleOfficialViewProps {
    form: FreeBillOfSale;
    onCopyText: () => void;
    isCopied: boolean;
    paperSize?: DocumentPaperSize;
    onPaperSizeChange?: (size: DocumentPaperSize) => void;
}

export const FreeBillOfSaleOfficialView: React.FC<FreeBillOfSaleOfficialViewProps> = ({
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
            { type: 'FREE_BILL_OF_SALE', data: form },
            {
                title: `قولنامه آزاد - ${form.buyerName || 'خریدار'}`,
                documentType: 'FREE_BILL_OF_SALE',
                paperSize
            }
        );
    };

    const handleExportWord = async () => {
        try {
            setIsExportingWord(true);
            await exportFreeBillToWord(form, paperSize);
        } catch (err) {
            console.error('Word export error:', err);
        } finally {
            setIsExportingWord(false);
        }
    };

    const amountFormatted = form.totalAmountRials > 0 ? formatCurrencyWithCommas(form.totalAmountRials) : '.................................';
    const amountWords = form.totalAmountRials > 0 ? numberToPersianWords(form.totalAmountRials) : '';

    return (
        <div className="space-y-4" dir="rtl">
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            پیش‌نمایش رسمی قولنامه آزاد خودرو
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
                        <span>{isCopied ? 'متن قولنامه کپی شد!' : 'کپی متن قولنامه'}</span>
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
                id="printable-free-bill-of-sale"
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
                <div className="border-b-2 border-slate-800 pb-4 mb-4 avoid-break">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-600 block">شرکت تضامنی حسینی خودرو شیراز</span>
                            <span className="text-[10px] text-slate-500">نمایندگی رسمی کرمان موتور - کد ۲۶۰۶</span>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-800 text-sm mb-1">بسمه تعالی</div>
                            <h1 className="text-xl font-black text-slate-900 tracking-wide border-b-2 border-teal-600 pb-0.5 inline-block">
                                قولنامه آزاد
                            </h1>
                        </div>
                        <div className="text-left text-[11px] space-y-1 font-mono text-slate-700">
                            <div><span className="font-sans font-bold text-slate-500 ml-1">شماره:</span>{toPersianDigits(form.contractNumber || '1405/FB-1001')}</div>
                            <div><span className="font-sans font-bold text-slate-500 ml-1">تاریخ:</span>{toPersianDigits(form.contractDate || '1405/06/22')}</div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className={`space-y-3 text-slate-900 text-justify doc-body-text ${paperSize === 'A5' ? 'text-[11px] leading-[1.95]' : 'text-xs sm:text-[13px] leading-[2.2]'}`}>
                    {/* Seller */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 avoid-break">
                        <p>
                            <span className="font-black">فروشنده: </span>
                            <span className="font-bold text-blue-900">{form.sellerTitle || 'خانم / آقای'} {form.sellerName || '........................'}</span>{' '}
                            <span className="font-bold mr-2">فرزند: </span>{form.sellerFatherName || '..............'}{' '}
                            <span className="font-bold mr-2">به شماره شناسنامه: </span><span className="font-mono">{toPersianDigits(form.sellerIdNumber) || '..............'}</span>{' '}
                            <span className="font-bold mr-2">صادره از: </span>{form.sellerIssuePlace || '............'}{' '}
                            <span className="font-bold mr-2">کد ملی: </span><span className="font-mono font-bold text-blue-900">{toPersianDigits(form.sellerNationalCode) || '....................'}</span>
                        </p>
                        <p className="mt-1">
                            <span className="font-bold">آدرس: </span>{form.sellerAddress || '................................................................'}{' '}
                            <span className="font-bold mr-3">کد پستی: </span><span className="font-mono">{toPersianDigits(form.sellerPostalCode) || '................'}</span>{' '}
                            <span className="font-bold mr-3">تلفن: </span><span className="font-mono">{toPersianDigits(form.sellerPhone) || '................'}</span>
                        </p>
                    </div>

                    {/* Buyer */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 avoid-break">
                        <p>
                            <span className="font-black">خریدار: </span>
                            <span className="font-bold text-blue-900">{form.buyerTitle || 'خانم/آقای'} {form.buyerName || '........................'}</span>{' '}
                            <span className="font-bold mr-2">فرزند: </span>{form.buyerFatherName || '..............'}{' '}
                            <span className="font-bold mr-2">به شماره شناسنامه: </span><span className="font-mono">{toPersianDigits(form.buyerIdNumber) || '..............'}</span>{' '}
                            <span className="font-bold mr-2">صادره از: </span>{form.buyerIssuePlace || '............'}{' '}
                            <span className="font-bold mr-2">کد ملی: </span><span className="font-mono font-bold text-blue-900">{toPersianDigits(form.buyerNationalCode) || '....................'}</span>
                        </p>
                        <p className="mt-1">
                            <span className="font-bold">آدرس: </span>{form.buyerAddress || '................................................................'}{' '}
                            <span className="font-bold mr-3">کدپستی: </span><span className="font-mono">{toPersianDigits(form.buyerPostalCode) || '................'}</span>{' '}
                            <span className="font-bold mr-3">تلفن: </span><span className="font-mono">{toPersianDigits(form.buyerPhone) || '................'}</span>
                        </p>
                    </div>

                    {/* Vehicle & Price */}
                    <div className="p-3 rounded-xl border border-slate-300 space-y-1.5 avoid-break">
                        <p>
                            <span className="font-black">مورد معامله: </span>
                            یکدستگاه خودروی <span className="font-bold text-blue-900">{form.carModel || '....................'}</span>{' '}
                            به شماره بدنه: <span className="font-mono font-bold">{form.chassisNumber || '........................'}</span>{' '}
                            به رنگ: <span className="font-bold">{form.color || '..........'}</span>{' '}
                            شماره شهربانی: <span className="font-bold font-mono">{form.plateNumber || '....................'}</span>
                        </p>
                        <p>
                            <span className="font-black">مبلغ مورد معامله: </span>
                            <span className="font-black text-emerald-800 font-mono">{toPersianDigits(amountFormatted)} ریال</span>
                            {amountWords && <span className="font-semibold"> ({amountWords} ریال)</span>}
                            {form.totalAmountDescription && <span className="text-slate-700 mr-2">— {form.totalAmountDescription}</span>}
                        </p>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="pt-1">
                        <p>
                            <span className="font-black">توضیحات: </span>
                            کلیه مخارج عوارض شهرداری و مالیات نقل و انتقال به عهده خریدار می‌باشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. فروشنده متعهد می‌گردد که ظرف مدت ۱۰ روز در دفترخانه اسناد رسمی حاضر و وکالت تعویض پلاک را به نام خریدار تنظیم نماید در غیر اینصورت روزانه مبلغ ۵۰۰ هزار تومان می‌بایست فروشنده به خریدار پرداخت نماید. خریدار نیز متعهد می‌گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک فروشنده را فک نماید. این معامله در تاریخ <span className="font-bold font-mono">{toPersianDigits(form.contractDate) || '............'}</span> و ساعت <span className="font-bold font-mono">{toPersianDigits(form.transactionTime) || '....:....'}</span> بصورت قطعی انجام شد و حق فسخ ندارد. کشف فساد و خلافی تا این تاریخ به عهده فروشنده می‌باشد و از این تاریخ به بعد به عهده خریدار می‌باشد. خریدار از کم و کیف خودرو اطلاع داشته و خودرو صحیح و سالم به رویت کامل ایشان رسید. قیمت معامله براساس قیمت روز و شرایط وضعیت موجود بوده و خریدار با علم و اطلاع اقدام به خرید کرده‌اند و نوسانات قیمت هیچ گونه تاثیری در مبایعه‌نامه ندارد و هرگونه ادعائی در حال و آینده از خود سلب می‌نماید. فروشنده و خریدار با امضا ذیل مبایعه‌نامه از کلیه مفاد قرارداد و مبایعه‌نامه مطلع و آگاه شده‌اند و با اراده شخصی و با علم و آگاهی از کم و کیف خودرو مورد معامله و اوضاع و احوال و زمان و مکان و نیز رضایت از ثمن معامله بین طرفین منعقد گردید. تمام کافه خیارات بخصوص غبن فاحش و تدلیس از طرفین ساقط گردید. مرجع رسیدگی به هرگونه شکایت در خصوص این مبایعه‌نامه شهرستان شیراز می‌باشد. چنانچه خریدار ظرف مدت مقرر در وکالت، تعویض پلاک ننماید از زمان اتمام تاریخ وکالت اولیه تا تاریخ تعویض پلاک روزانه مبلغ ۵۰۰ هزار تومان می‌بایست خریدار به فروشنده پرداخت نماید و هزینه وکالت مجدد با خریدار می‌باشد. تمامی مدارک خودرو اعم از <span className="font-bold text-blue-900">{form.deliveredDocuments || '................................................................'}</span> تحویل خریدار گردید.
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="avoid-break signature-box mt-8 pt-4 border-t-2 border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-8 p-2">
                            <span className="font-black text-xs text-slate-800 block">امضاء فروشنده</span>
                            <span className="text-[10px] text-slate-500 block">{form.sellerTitle || ''} {form.sellerName || '....................'}</span>
                        </div>
                        <div className="space-y-8 p-2">
                            <span className="font-black text-xs text-slate-800 block">امضاء خریدار</span>
                            <span className="text-[10px] text-slate-500 block">{form.buyerTitle || ''} {form.buyerName || '....................'}</span>
                        </div>
                        <div className="space-y-8 p-2">
                            <span className="font-black text-xs text-slate-800 block">امضاء شاهد</span>
                            <span className="text-[10px] text-slate-500 block">نام و امضای شاهد</span>
                        </div>
                    </div>
                </div>
            </PaginatedDocumentSheet>

            <HtmlPrintPreviewModal
                isOpen={isHtmlPreviewOpen}
                onClose={() => setIsHtmlPreviewOpen(false)}
                payload={{ type: 'FREE_BILL_OF_SALE', data: form }}
                paperSize={paperSize}
                onPaperSizeChange={handlePaperSizeChange}
                documentTitle={`قولنامه آزاد - ${form.buyerName || form.sellerName || 'مشتری'}`}
            />
        </div>
    );
};
