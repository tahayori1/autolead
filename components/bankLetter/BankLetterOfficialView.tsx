import React, { useState } from 'react';
import type { BankLetter, DocumentPaperSize } from '../../types/bankLetter';
import { formatCurrencyWithCommas, numberToPersianWords, toPersianDigits } from '../../services/bankLetterValidation';
import { exportBankLetterToWord } from '../../services/wordExportService';
import { printOfficialDocument } from '../../services/documentPrintService';
import { PaginatedDocumentSheet, PaperSizeSelector } from './PaginatedDocumentSheet';
import { HtmlPrintPreviewModal } from './HtmlPrintPreviewModal';
import { Printer, Copy, Check, ShieldCheck, QrCode, FileDown, Loader2, Eye } from 'lucide-react';

interface BankLetterOfficialViewProps {
    letter: BankLetter;
    onCopyText?: () => void;
    isCopied?: boolean;
    paperSize?: DocumentPaperSize;
    onPaperSizeChange?: (size: DocumentPaperSize) => void;
}

export const BankLetterOfficialView: React.FC<BankLetterOfficialViewProps> = ({
    letter,
    onCopyText,
    isCopied = false,
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

    const formattedAmount = formatCurrencyWithCommas(letter.amountRials);
    const amountInWords = letter.amountWords || (numberToPersianWords(letter.amountRials) + ' ریال');
    const branchText = letter.destinationBranchName ? ` ${letter.destinationBranchName}` : '';
    const colorText = letter.carColor ? ` به رنگ ${letter.carColor}` : '';
    const yearText = letter.carModelYear ? ` مدل ${letter.carModelYear}` : '';

    const handlePrint = async () => {
        await printOfficialDocument(
            { type: 'BANK_LETTER', data: letter },
            {
                title: `نامه بانک - ${letter.customerName || 'مشتری'}`,
                documentType: 'BANK_LETTER',
                paperSize
            }
        );
    };

    const handleExportWord = async () => {
        try {
            setIsExportingWord(true);
            await exportBankLetterToWord(letter, paperSize);
        } catch (error) {
            console.error('Error generating Word document for bank letter:', error);
        } finally {
            setIsExportingWord(false);
        }
    };

    return (
        <div className="space-y-4" dir="rtl">
            {/* Action Bar */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        قالب رسمی نامه بانک
                    </span>
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
                            isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md'
                        }`}
                        title="کپی متن کامل نامه"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'متن نامه کپی شد!' : 'کپی متن نامه'}</span>
                    </button>

                    <button
                        onClick={handleExportWord}
                        disabled={isExportingWord}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                        title="دانلود فایل Word رسمی با قطع کاغذ انتخابی"
                    >
                        {isExportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
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
                        title="چاپ مستقیم یا ذخیره تمیز به صورت PDF"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ ({paperSize}) / PDF</span>
                    </button>
                </div>
            </div>

            {/* Paginated Official Letter Sheet */}
            <PaginatedDocumentSheet
                id="printable-bank-letter"
                paperSize={paperSize}
                onPageCountChange={setPageCount}
                watermark={
                    <div className="text-center transform -rotate-12">
                        <div className="text-7xl font-black tracking-widest text-slate-900">HOSEINI KHODRO</div>
                        <div className="text-3xl font-bold mt-2 text-slate-700">KERMAN MOTOR 2606</div>
                    </div>
                }
                footer={
                    <>
                        <span>شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)</span>
                        <span>تلفن تماس: ۰۷۱۹۱۶۹۰۹۰۶ | سامانه فروش اتولید</span>
                    </>
                }
            >
                {/* Letterhead Header */}
                <div className="relative border-b-2 border-blue-600 pb-4 mb-6 flex items-start justify-between gap-2 avoid-break">
                    <div className="flex items-center gap-3">
                        <div className={`${paperSize === 'A5' ? 'w-11 h-11 text-base' : 'w-14 h-14 text-xl'} rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-black shadow-md border-2 border-white shrink-0`}>
                            <span>۲۶۰۶</span>
                        </div>
                        <div>
                            <h2 className={`${paperSize === 'A5' ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-black text-blue-950 tracking-tight`}>
                                شرکت حسینی خودرو شیراز
                            </h2>
                            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                                نمایندگی رسمی ۲۶۰۶ کرمان موتور
                            </p>
                        </div>
                    </div>

                    <div className="text-left text-xs sm:text-sm space-y-1 text-slate-700 font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-500">تاریخ:</span>
                            <span className="font-bold text-slate-900">{toPersianDigits(letter.letterDate || '1405/06/22')}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-500">شماره:</span>
                            <span className="font-bold font-mono text-slate-900" dir="ltr">{letter.letterNumber || '1405/KM2606/---'}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-500">پیوست:</span>
                            <span className="font-bold text-slate-900">ندارد</span>
                        </div>
                    </div>
                </div>

                {/* "بنام خدا" */}
                <div className="text-center my-4">
                    <span className="text-base sm:text-lg font-black text-slate-800 tracking-wider">
                        بنام خدا
                    </span>
                </div>

                {/* Addressee */}
                <div className="my-5 avoid-break">
                    <h3 className={`${paperSize === 'A5' ? 'text-base' : 'text-lg sm:text-xl'} font-black text-slate-900`}>
                        ریاست محترم {letter.destinationBankName || 'بانک ...'}{branchText}
                    </h3>
                    <div className="text-sm sm:text-base font-bold text-slate-700 mt-1">
                        با سلام
                    </div>
                </div>

                {/* Letter Body */}
                <p className={`${paperSize === 'A5' ? 'text-xs sm:text-sm leading-[2.2]' : 'text-base sm:text-lg leading-[2.6]'} text-justify text-slate-800 my-6 doc-body-text`}>
                    احتراماً{' '}
                    <strong className="font-bold text-slate-950">{letter.customerTitle || 'خانم/آقای'}</strong>{' '}
                    <span className="font-bold text-blue-900 bg-blue-50/70 px-1.5 py-0.5 rounded-md border border-blue-100">
                        {letter.customerName || '....................'}
                    </span>{' '}
                    به کدملی{' '}
                    <span className="font-bold font-mono tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {toPersianDigits(letter.customerNationalCode) || '..........'}
                    </span>{' '}
                    جهت امور بانکی و واریز وجه به مبلغ{' '}
                    <span className="font-bold text-blue-900 bg-blue-50/70 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">
                        {toPersianDigits(formattedAmount || '0')} ریال
                    </span>{' '}
                    <span className="text-slate-700 font-medium">({amountInWords})</span>{' '}
                    <strong className="font-bold text-slate-950">{letter.paymentMethod || 'بصورت حواله ساتنا'}</strong>{' '}
                    به شماره شبا{' '}
                    <span dir="ltr" className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block tracking-wider">
                        {letter.shebaNumber || '........................'}
                    </span>{' '}
                    <strong className="font-bold text-slate-950">{letter.beneficiaryBankName || 'بانک ...'}</strong>{' '}
                    بنام{' '}
                    <span className="font-bold text-blue-900 bg-blue-50/70 px-2 py-0.5 rounded-md border border-blue-100">
                        {letter.accountHolderName || 'شرکت حسینی خودرو شیراز'}
                    </span>{' '}
                    جهت خرید یک دستگاه{' '}
                    <span className="font-bold text-slate-950 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {letter.carModel || '...'}
                    </span>
                    {yearText && <span className="font-bold text-slate-950">{yearText}</span>}
                    {colorText && <span className="font-bold text-slate-950">{colorText}</span>}{' '}
                    به خدمت حضورتان معرفی می گردند.
                </p>

                {/* Closing formal sentence */}
                <p className={`${paperSize === 'A5' ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'} leading-loose text-justify text-slate-800 my-5 font-medium`}>
                    خواهشمند است بذل لطف نموده همکاری های لازم با نامبرده را مبذول فرمایید.
                </p>

                {/* Optional Notes */}
                {letter.notes && letter.notes.trim() && (
                    <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        <span className="font-bold text-slate-900 block mb-1">توضیحات تکمیلی:</span>
                        {letter.notes.trim()}
                    </div>
                )}

                {/* Footer Signature & Stamp Box */}
                <div className="avoid-break signature-box mt-12 pt-6 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <QrCode className="w-10 h-10 text-slate-700 shrink-0" />
                        <div>
                            <div className="font-bold text-slate-700">اصالت‌سنجی نامه اداری</div>
                            <div>کد یکتا: {letter.letterNumber}</div>
                            <div>سامانه جامع نمایندگی ۲۶۰۶ کرمان موتور</div>
                        </div>
                    </div>

                    <div className="text-center min-w-[200px]">
                        <div className="text-sm font-bold text-slate-700 mb-1">با تشکر و احترام</div>
                        <div className="text-base font-black text-blue-950">
                            {letter.dealershipName || 'نمایندگی ۲۶۰۶ کرمان موتور'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            (شرکت حسینی خودرو شیراز)
                        </div>
                        <div className="h-14 flex items-center justify-center opacity-40">
                            <span className="text-xs text-slate-400 italic">[محل امضا و مهر نمایندگی]</span>
                        </div>
                    </div>
                </div>
            </PaginatedDocumentSheet>

            <HtmlPrintPreviewModal
                isOpen={isHtmlPreviewOpen}
                onClose={() => setIsHtmlPreviewOpen(false)}
                payload={{ type: 'BANK_LETTER', data: letter }}
                paperSize={paperSize}
                onPaperSizeChange={handlePaperSizeChange}
                documentTitle={`نامه معرفی به بانک - ${letter.customerName || 'مشتری'}`}
            />
        </div>
    );
};
