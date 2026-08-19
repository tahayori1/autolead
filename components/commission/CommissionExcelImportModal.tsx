import React, { useState } from 'react';
import { CommissionDeal } from '../../types';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface CommissionExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (importedDeals: CommissionDeal[]) => void;
    activePeriodId: string;
    activePeriodName: string;
}

export const CommissionExcelImportModal: React.FC<CommissionExcelImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    activePeriodId,
    activePeriodName
}) => {
    const [rawText, setRawText] = useState('');
    const [parsedDeals, setParsedDeals] = useState<CommissionDeal[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'preview'>('input');

    if (!isOpen) return null;

    // Helper to clean price strings with commas and quotes
    const cleanNumber = (val: string): number => {
        if (!val) return 0;
        // remove quotes, spaces, rials text, commas
        const cleaned = val
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/,/g, '')
            .replace(/،/g, '')
            .replace(/\s+/g, '')
            .trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    // CSV Splitter that handles quoted cells with commas
    const parseCSVLine = (text: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if ((char === ',' || char === '\t') && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const handleParseText = () => {
        setParseError(null);
        if (!rawText.trim()) {
            setParseError('لطفاً داده‌های اکسل یا فایل CSV را در کادر وارد کنید.');
            return;
        }

        try {
            const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
            const deals: CommissionDeal[] = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Skip header lines or total lines
                if (
                    line.includes('ردیف') ||
                    line.includes('نام پرسنل') ||
                    line.includes('جمع کل') ||
                    line.includes('انبار')
                ) {
                    continue;
                }

                const cols = parseCSVLine(line);
                if (cols.length < 5) continue;

                // Structure:
                // 0: ردیف
                // 1: تاریخ خرید
                // 2: تاریخ فروش
                // 3: نام پرسنل فروش (یا پرسنل / قولنامه ...)
                // 4: نام مشتری
                // 5: مدل خودرو
                // 6: نرخ خرید
                // 7: قیمت روز
                // 8: نرخ فروش
                // 9: سود یا زیان روز
                // 10: درصد پورسانت
                // 11: پورسانت
                // 12: سهم پورسانت پرداختی / توضیحات
                // 13: توضیحات واریز

                const salesPersonRaw = cols[3] || '';
                const customerName = cols[4] || '';
                const carModel = cols[5] || '';

                if (!salesPersonRaw && !customerName && !carModel) {
                    continue; // Skip empty rows
                }

                // Check if contract writer is included e.g. "عرشیا عسکری / قولنامه طرلان منوچهری"
                let salesPerson = salesPersonRaw;
                let contractWriter = '';
                if (salesPersonRaw.includes('/')) {
                    const parts = salesPersonRaw.split('/');
                    salesPerson = parts[0].replace('قولنامه', '').trim();
                    contractWriter = parts[1].replace('قولنامه', '').trim();
                }

                const purchaseDate = cols[1] || '';
                const saleDate = cols[2] || `1405/${activePeriodId.slice(5)}/01`;
                const purchasePrice = cleanNumber(cols[6] || '0');
                const dailyPrice = cleanNumber(cols[7] || '0');
                const salePrice = cleanNumber(cols[8] || '0');
                const dailyProfitLoss = cols[9] !== undefined ? cleanNumber(cols[9]) : (salePrice - dailyPrice);
                const grossProfit = salePrice > 0 && purchasePrice > 0 ? salePrice - purchasePrice : 0;
                
                let commissionRate = 0.05;
                if (cols[10]) {
                    const rateVal = cleanNumber(cols[10]);
                    commissionRate = rateVal > 1 ? rateVal / 100 : (rateVal > 0 ? rateVal : 0.05);
                }

                const commissionAmount = cleanNumber(cols[11] || '0') || Math.round(salePrice * (commissionRate / 100));
                
                // Check col 12 and 13 for paid share or notes
                let paidCommissionShare: number | undefined = undefined;
                let paymentNotes = '';

                if (cols[12]) {
                    const numShare = cleanNumber(cols[12]);
                    if (numShare > 0) {
                        paidCommissionShare = numShare;
                    } else if (cols[12].trim() !== '-' && cols[12].trim().length > 2) {
                        paymentNotes = cols[12].trim();
                    }
                }

                if (cols[13] && cols[13].trim()) {
                    paymentNotes = paymentNotes ? `${paymentNotes} | ${cols[13].trim()}` : cols[13].trim();
                }

                const paymentStatus = paymentNotes.includes('واریز شد') || paymentNotes.includes('تسویه')
                    ? 'PAID'
                    : (paidCommissionShare && paidCommissionShare < commissionAmount ? 'PARTIAL' : 'PENDING');

                deals.push({
                    id: `import-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                    category: 'ANBAR',
                    rowNumber: deals.length + 1,
                    periodId: activePeriodId,
                    periodName: activePeriodName,
                    purchaseDate,
                    saleDate,
                    salesPerson,
                    contractWriter: contractWriter || undefined,
                    customerName,
                    carModel,
                    purchasePrice,
                    dailyPrice,
                    salePrice,
                    dailyProfitLoss,
                    grossProfit,
                    commissionRate,
                    commissionAmount,
                    paidCommissionShare: paidCommissionShare ?? commissionAmount,
                    paymentStatus,
                    paymentNotes: paymentNotes || undefined,
                    createdAt: new Date().toISOString()
                });
            }

            if (deals.length === 0) {
                setParseError('هیچ ردیف معتبری شناسایی نشد. لطفاً از صحت فرمت داده‌ها اطمینان حاصل کنید.');
                return;
            }

            setParsedDeals(deals);
            setStep('preview');
        } catch (e: any) {
            setParseError(`خطا در پردازش فایل: ${e?.message || 'قالب نامعتبر'}`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setRawText(content);
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleConfirmImport = () => {
        onImport(parsedDeals);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-l from-indigo-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                درون‌ریزی فایل اکسل / CSV کمیسیون و پورسانت
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                دوره مقصد: <span className="font-bold text-indigo-600 dark:text-indigo-400">{activePeriodName}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'input' ? (
                        <div className="space-y-5">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                                        انتخاب فایل CSV یا اکسل خروجی
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        پشتیبانی از جداول اکسل کپی‌شده، فایل CSV با جداکننده کاما یا تب
                                    </p>
                                </div>
                                <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap">
                                    <Upload className="w-4 h-4" />
                                    انتخاب فایل از دستگاه
                                    <input
                                        type="file"
                                        accept=".csv,.txt,.tsv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    یا متن اکسل / CSV را مستقیماً در کادر زیر جای‌گذاری (Paste) کنید:
                                </label>
                                <textarea
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                    rows={10}
                                    placeholder="ردیف,تاریخ خرید,تاریخ فروش,نام پرسنل فروش,نام مشتری,مدل خودرو,نرخ خرید,قیمت روز,نرخ فروش,سودیا زیان روز,درصد پورسانت,پورسانت&#10;1,,1405/05/10,درسا محمدی,هدیه توکلی ریشهری,(1405) eagle,21000000000,24500000000,24600000000,100000000,0.05,12300000"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                                    dir="ltr"
                                />
                            </div>

                            {parseError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    {parseError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    تعداد معاملات شناسایی‌شده: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{parsedDeals.length}</span> مورد
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStep('input')}
                                    className="text-xs text-indigo-600 hover:underline font-bold"
                                >
                                    ویرایش داده‌های ورودی
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-[50vh]">
                                <table className="w-full text-xs text-right border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-2.5">#</th>
                                            <th className="p-2.5">تاریخ</th>
                                            <th className="p-2.5">پرسنل فروش</th>
                                            <th className="p-2.5">نام مشتری</th>
                                            <th className="p-2.5">خودرو</th>
                                            <th className="p-2.5">نرخ فروش (ریال)</th>
                                            <th className="p-2.5">سود/زیان روز</th>
                                            <th className="p-2.5">پورسانت</th>
                                            <th className="p-2.5">وضعیت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                        {parsedDeals.map((deal, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                                                <td className="p-2.5 font-mono">{deal.saleDate}</td>
                                                <td className="p-2.5 font-bold">
                                                    {deal.salesPerson}
                                                    {deal.contractWriter && (
                                                        <span className="text-[10px] text-slate-400 block">
                                                            قولنامه: {deal.contractWriter}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2.5">{deal.customerName}</td>
                                                <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">{deal.carModel}</td>
                                                <td className="p-2.5 font-mono">{deal.salePrice.toLocaleString('fa-IR')}</td>
                                                <td className={`p-2.5 font-mono font-bold ${deal.dailyProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {deal.dailyProfitLoss.toLocaleString('fa-IR')}
                                                </td>
                                                <td className="p-2.5 font-mono font-black text-emerald-600">
                                                    {deal.commissionAmount.toLocaleString('fa-IR')}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        deal.paymentStatus === 'PAID'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : deal.paymentStatus === 'PARTIAL'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {deal.paymentStatus === 'PAID' ? 'واریز شد' : deal.paymentStatus === 'PARTIAL' ? 'علی‌الحساب' : 'در انتظار'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        انصراف
                    </button>
                    {step === 'input' ? (
                        <button
                            type="button"
                            onClick={handleParseText}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            پردازش و پیش‌نمایش
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleConfirmImport}
                            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            تایید و افزودن {parsedDeals.length} معامله
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
