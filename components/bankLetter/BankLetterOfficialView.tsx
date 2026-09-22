import React, { useRef } from 'react';
import type { BankLetter } from '../../types/bankLetter';
import { formatCurrencyWithCommas, numberToPersianWords, toPersianDigits, formatShebaBlocks } from '../../services/bankLetterValidation';
import { Printer, Copy, Check, ShieldCheck, Building2, Car, QrCode } from 'lucide-react';

interface BankLetterOfficialViewProps {
    letter: BankLetter;
    onCopyText?: () => void;
    isCopied?: boolean;
}

export const BankLetterOfficialView: React.FC<BankLetterOfficialViewProps> = ({
    letter,
    onCopyText,
    isCopied = false
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    const formattedAmount = formatCurrencyWithCommas(letter.amountRials);
    const amountInWords = letter.amountWords || (numberToPersianWords(letter.amountRials) + ' ریال');
    const branchText = letter.destinationBranchName ? ` ${letter.destinationBranchName}` : '';
    const colorText = letter.carColor ? ` به رنگ ${letter.carColor}` : '';
    const yearText = letter.carModelYear ? ` مدل ${letter.carModelYear}` : '';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        قالب رسمی نامه بانک
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        نوع: {letter.letterType === 'CORPORATE' ? 'حقوقی / شرکتی' : 'شخصی / حقیقی'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onCopyText}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
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
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="چاپ یا ذخیره به صورت PDF"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ / PDF</span>
                    </button>
                </div>
            </div>

            {/* Official Letter Paper Layout (A4 Style) */}
            <div 
                ref={printRef}
                className="bank-letter-print-area relative bg-white text-slate-900 p-8 sm:p-12 md:p-14 rounded-3xl border border-slate-200 shadow-xl max-w-4xl mx-auto font-vazir leading-loose select-text overflow-hidden"
                style={{ minHeight: '800px' }}
            >
                {/* Background Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
                    <div className="text-center transform -rotate-12">
                        <div className="text-8xl font-black tracking-widest text-slate-900">HOSEINI KHODRO</div>
                        <div className="text-4xl font-bold mt-2 text-slate-700">KERMAN MOTOR 2606</div>
                    </div>
                </div>

                {/* Letterhead Header Table */}
                <div className="relative border-b-2 border-blue-600 pb-5 mb-8 flex items-start justify-between">
                    {/* Right: Company Logo & Identity */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                            <span>۲۶۰۶</span>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                                شرکت حسینی خودرو شیراز
                            </h2>
                            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                                نمایندگی رسمی ۲۶۰۶ کرمان موتور
                            </p>
                        </div>
                    </div>

                    {/* Left: Administrative Metadata */}
                    <div className="text-left text-xs sm:text-sm space-y-1 text-slate-700 font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-slate-900">{toPersianDigits(letter.letterDate || '1405/06/22')}</span>
                            <span className="text-slate-500">:تاریخ</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold font-mono text-slate-900">{letter.letterNumber || '1405/KM2606/---'}</span>
                            <span className="text-slate-500">:شماره</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-slate-900">ندارد</span>
                            <span className="text-slate-500">:پیوست</span>
                        </div>
                    </div>
                </div>

                {/* "بنام خدا" */}
                <div className="text-center my-6">
                    <span className="text-lg font-black text-slate-800 tracking-wider font-vazir">
                        بنام خدا
                    </span>
                </div>

                {/* Addressee */}
                <div className="my-6">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        ریاست محترم {letter.destinationBankName || 'بانک ...'}{branchText}
                    </h3>
                    <div className="text-base font-bold text-slate-700 mt-1">
                        با سلام
                    </div>
                </div>

                {/* Letter Body */}
                <div className="text-base sm:text-lg leading-[2.6] text-justify text-slate-800 my-8">
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
                    <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 direction-ltr inline-block tracking-wider">
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
                </div>

                {/* Closing formal sentence */}
                <div className="text-base sm:text-lg leading-loose text-justify text-slate-800 my-6 font-medium">
                    خواهشمند است بذل لطف نموده همکاری های لازم با نامبرده را مبذول فرمایید.
                </div>

                {/* Footer Signature & Stamp Box */}
                <div className="mt-16 pt-8 flex items-end justify-between">
                    {/* Security Verification & QR */}
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <QrCode className="w-10 h-10 text-slate-700 shrink-0" />
                        <div>
                            <div className="font-bold text-slate-700">اصالت‌سنجی نامه اداری</div>
                            <div>کد یکتا: {letter.letterNumber}</div>
                            <div>سامانه جامع نمایندگی ۲۶۰۶ کرمان موتور</div>
                        </div>
                    </div>

                    {/* Signature Block */}
                    <div className="text-center min-w-[220px]">
                        <div className="text-sm font-bold text-slate-700 mb-1">با تشکر و احترام</div>
                        <div className="text-base font-black text-blue-950">
                            {letter.dealershipName || 'نمایندگی ۲۶۰۶ کرمان موتور'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            (شرکت حسینی خودرو شیراز)
                        </div>
                        <div className="h-16 flex items-center justify-center opacity-40">
                            <span className="text-xs text-slate-400 italic">[محل امضا و مهر نمایندگی]</span>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                    <span>شیراز - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)</span>
                    <span>تلفن تماس: ۰۷۱-۳۷۲۶۰۰۰۰ | سامانه فروش اتولید</span>
                </div>
            </div>
        </div>
    );
};
