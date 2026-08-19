import React, { useState, useMemo } from 'react';
import { CommissionDeal, CommissionPeriod } from '../../../types';
import { parseSalesPersons } from '../../../services/commissionService';
import { 
    CreditCard, 
    DollarSign, 
    FileSpreadsheet, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Printer, 
    Download, 
    Receipt, 
    ShieldCheck, 
    Layers, 
    FileText, 
    Search,
    Landmark
} from 'lucide-react';

interface CommissionFinanceViewProps {
    deals: CommissionDeal[];
    activePeriod: CommissionPeriod;
    currencyUnit: 'RIAL' | 'TOMAN';
    onApproveFinance: () => void;
    onOpenPrintReport: (type: 'FINANCE') => void;
}

export const CommissionFinanceView: React.FC<CommissionFinanceViewProps> = ({
    deals,
    activePeriod,
    currencyUnit,
    onApproveFinance,
    onOpenPrintReport
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    const [searchQuery, setSearchQuery] = useState('');
    const [voucherNumber, setVoucherNumber] = useState<string>(activePeriod.approvals?.voucherNumber || `VCH-${activePeriod.id.replace('-', '')}-01`);

    // Predefined bank accounts / IBAN for staff (Mock standard structure)
    const STAFF_BANK_DETAILS: Record<string, { iban: string; bank: string; account: string }> = {
        'درسا محمدی': { iban: 'IR450170000000123456789012', bank: 'بانک ملت', account: '1234567890' },
        'محمد مبین غلامی': { iban: 'IR890120000000987654321098', bank: 'بانک ملی', account: '9876543210' },
        'ندا قاسمی': { iban: 'IR120560000000456123789456', bank: 'بانک پاسارگاد', account: '4561237894' },
        'طرلان منوچهری': { iban: 'IR340620000000789456123789', bank: 'بانک سامان', account: '7894561237' },
        'عرشیا عسکری': { iban: 'IR780190000000321654987321', bank: 'بانک صادرات', account: '3216549873' },
        'شبنم کشاورز': { iban: 'IR560180000000654987321654', bank: 'بانک تجارت', account: '6549873216' },
        'امین رضا موسوی اصل': { iban: 'IR900210000000147258369147', bank: 'بانک شهر', account: '1472583691' },
        'مرضیه ایران نژاد': { iban: 'IR230550000000258369147258', bank: 'بانک اقتصاد نوین', account: '2583691472' },
        'هیلدا منوچهری': { iban: 'IR670160000000369147258369', bank: 'بانک آینده', account: '3691472583' },
        'محسن موسوی': { iban: 'IR890150000000741852963741', bank: 'بانک سپه', account: '7418529637' },
        'مریم یوسفی': { iban: 'IR120140000000852963741852', bank: 'بانک رفاه', account: '8529637418' },
        'زهرا زارع': { iban: 'IR450130000000963741852963', bank: 'بانک گردشگری', account: '9637418529' },
    };

    // Calculate finance disbursements
    const financeData = useMemo(() => {
        const staffMap: Record<string, {
            name: string;
            grossCommission: number;
            bonus: number;
            deductions: number;
            netPayable: number;
            paidAmount: number;
            remainingToPay: number;
            bank: string;
            iban: string;
            paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
        }> = {};

        const adjustments = activePeriod.adjustments || {};

        // Seed ندا قاسمی
        staffMap['ندا قاسمی'] = {
            name: 'ندا قاسمی',
            grossCommission: 5837500,
            bonus: adjustments['ندا قاسمی']?.bonus || 0,
            deductions: adjustments['ندا قاسمی']?.deductions || 0,
            netPayable: 5837500,
            paidAmount: 5837500,
            remainingToPay: 0,
            bank: STAFF_BANK_DETAILS['ندا قاسمی']?.bank || 'بانک ملت',
            iban: STAFF_BANK_DETAILS['ندا قاسمی']?.iban || 'IR...',
            paymentStatus: 'PAID'
        };

        deals.forEach(deal => {
            const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);
            
            const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || 'نامشخص'];
            const shareFactor = 1 / staffList.length;
            const comm = Math.round((deal.commissionAmount || 0) * shareFactor);

            staffList.forEach(name => {
                if (!staffMap[name]) {
                    const adj = adjustments[name] || { bonus: 0, deductions: 0 };
                    staffMap[name] = {
                        name,
                        grossCommission: 0,
                        bonus: adj.bonus || 0,
                        deductions: adj.deductions || 0,
                        netPayable: 0,
                        paidAmount: 0,
                        remainingToPay: 0,
                        bank: STAFF_BANK_DETAILS[name]?.bank || 'بانک ملت',
                        iban: STAFF_BANK_DETAILS[name]?.iban || 'IR...',
                        paymentStatus: 'PENDING'
                    };
                }

                staffMap[name].grossCommission += comm;

                if (deal.paymentStatus === 'PAID') {
                    staffMap[name].paidAmount += comm;
                } else if (deal.paymentStatus === 'PARTIAL' && deal.paidCommissionShare) {
                    staffMap[name].paidAmount += Math.round(deal.paidCommissionShare * shareFactor);
                }
            });
        });

        const list = Object.values(staffMap).map(item => {
            item.netPayable = Math.max(0, (item.grossCommission + item.bonus) - item.deductions);
            item.remainingToPay = Math.max(0, item.netPayable - item.paidAmount);

            if (item.paidAmount >= item.netPayable && item.netPayable > 0) {
                item.paymentStatus = 'PAID';
            } else if (item.paidAmount > 0) {
                item.paymentStatus = 'PARTIAL';
            } else {
                item.paymentStatus = 'PENDING';
            }

            return item;
        }).sort((a, b) => b.netPayable - a.netPayable);

        const totalGross = list.reduce((sum, i) => sum + i.grossCommission, 0);
        const totalBonus = list.reduce((sum, i) => sum + i.bonus, 0);
        const totalDeductions = list.reduce((sum, i) => sum + i.deductions, 0);
        const totalNetPayable = list.reduce((sum, i) => sum + i.netPayable, 0);
        const totalPaid = list.reduce((sum, i) => sum + i.paidAmount, 0);
        const totalRemaining = list.reduce((sum, i) => sum + i.remainingToPay, 0);

        return {
            list,
            totalGross: Math.round(totalGross / divisor),
            totalBonus: Math.round(totalBonus / divisor),
            totalDeductions: Math.round(totalDeductions / divisor),
            totalNetPayable: Math.round(totalNetPayable / divisor),
            totalPaid: Math.round(totalPaid / divisor),
            totalRemaining: Math.round(totalRemaining / divisor),
        };
    }, [deals, activePeriod, divisor]);

    const isFinanceApproved = Boolean(activePeriod.approvals?.financeApproved);

    // Export Bank Payment File (Paya CSV)
    const handleExportBankCSV = () => {
        const payableList = financeData.list.filter(i => i.netPayable > 0);
        if (payableList.length === 0) {
            alert('هیچ مبلغی برای صدور دستور پرداخت بانکی وجود ندارد.');
            return;
        }

        const headers = ['ردیف', 'نام و نام خانوادگی ذینفع', 'شماره شبا (IBAN)', 'نام بانک', 'مبلغ خالص پرداختی (ریال)', 'شناسه واریز / بابت'];
        const rows = payableList.map((item, idx) => [
            idx + 1,
            `"${item.name}"`,
            `"${item.iban}"`,
            `"${item.bank}"`,
            item.netPayable * (currencyUnit === 'TOMAN' ? 10 : 1),
            `"تسویه پورسانت دوره ${activePeriod.title}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bank_payment_paya_${activePeriod.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return financeData.list;
        const q = searchQuery.toLowerCase();
        return financeData.list.filter(i => i.name.toLowerCase().includes(q));
    }, [financeData.list, searchQuery]);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* Finance Manager Control Bar */}
            <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-blue-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-400/30">
                            <Landmark className="w-3.5 h-3.5" />
                            داشبورد اسناد مالی، تسویه و خزانه
                        </div>
                        <h2 className="text-xl font-black text-white">
                            کنترل کسورات، صدور سند حسابداری و دستور واریز پایا ({activePeriod.title})
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                            سند حسابداری پورسانت: <span className="font-mono text-amber-300 font-bold">{voucherNumber}</span> • نظارت بر پرداخت‌های گروهی و مطابقت بانکی
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleExportBankCSV}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            خروجی فایل پایا / شبا
                        </button>

                        <button
                            onClick={() => onOpenPrintReport('FINANCE')}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ دستور پرداخت مالی
                        </button>

                        <button
                            onClick={onApproveFinance}
                            className={`px-5 py-2.5 text-xs font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                                isFinanceApproved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {isFinanceApproved ? 'تأیید و ثبت سند توسط مدیر مالی' : 'تأیید اسناد مالی و صدور سند'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Net Payable */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">مجموع خالص قابل پرداخت</span>
                    <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {financeData.totalNetPayable.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block">
                        (پورسانت ناخالص + پاداش‌ها) - کسورات
                    </span>
                </div>

                {/* 2. Paid vs Remaining */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">مبالغ واریز شده / مانده</span>
                    <div className="font-mono font-black text-xl text-slate-800 dark:text-white">
                        {financeData.totalPaid.toLocaleString('fa-IR')}
                        <span className="text-xs text-rose-500 font-bold mr-2">
                            (مانده: {financeData.totalRemaining.toLocaleString('fa-IR')})
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                        <span>سند حسابداری: فعال</span>
                        <span className="text-emerald-600 font-bold">تسویه خزانه</span>
                    </div>
                </div>

                {/* 3. Deductions & Penalties */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">مجموع کسورات و جریمه‌ها</span>
                    <div className="font-mono font-black text-2xl text-rose-600">
                        {financeData.totalDeductions > 0 ? `-${financeData.totalDeductions.toLocaleString('fa-IR')}` : '۰'}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block">
                        پاداش‌های مدیریتی: <b>+{financeData.totalBonus.toLocaleString('fa-IR')}</b>
                    </span>
                </div>

                {/* 4. Accounting Voucher Box */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                        📑 سند حسابداری دوطرفه دوره
                    </span>
                    <div className="text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-400">
                        <div>بدهکار: هزینه پورسانت فروش (کد ۵۱۰۲)</div>
                        <div>بستانکار: جاری کارکنان و مشاوران (کد ۴۰۳)</div>
                    </div>
                    <div className="font-mono font-bold text-xs text-indigo-600 mt-2">
                        شماره سند: {voucherNumber}
                    </div>
                </div>

            </div>

            {/* Bank Disbursement List Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">
                            لیست تجمیعی واریزی و دستور پرداخت بانکی پرسنل (پایا)
                        </h3>
                        <p className="text-xs text-slate-400">
                            کنترل شماره شبا، بانک مقصد، مبالغ ناخالص و خالص پرداخت به تفکیک کارشناس
                        </p>
                    </div>

                    <div className="relative min-w-[200px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجوی نام کارشناس..."
                            className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3 px-3 text-center">ردیف</th>
                                <th className="py-3 px-4">نام ذینفع</th>
                                <th className="py-3 px-3">بانک مقصد</th>
                                <th className="py-3 px-3.5">شماره شبا (IBAN)</th>
                                <th className="py-3 px-3">پورسانت ناخالص ({unitLabel})</th>
                                <th className="py-3 px-3 text-emerald-600">پاداش (+)</th>
                                <th className="py-3 px-3 text-rose-600">کسورات (-)</th>
                                <th className="py-3 px-4 font-black text-emerald-700 dark:text-emerald-300">خالص پرداختی ({unitLabel})</th>
                                <th className="py-3 px-3">وضعیت تسویه</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredList.map((item, idx) => (
                                <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                        {idx + 1}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                                        {item.name}
                                    </td>
                                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {item.bank}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap text-[11px]" dir="ltr">
                                        {item.iban}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        {item.grossCommission > 0 ? Math.round(item.grossCommission / divisor).toLocaleString('fa-IR') : '-'}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                                        {item.bonus > 0 ? `+${Math.round(item.bonus / divisor).toLocaleString('fa-IR')}` : '-'}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-rose-600 whitespace-nowrap">
                                        {item.deductions > 0 ? `-${Math.round(item.deductions / divisor).toLocaleString('fa-IR')}` : '-'}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20">
                                        {item.netPayable > 0 ? Math.round(item.netPayable / divisor).toLocaleString('fa-IR') : '۰'}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                        {item.paymentStatus === 'PAID' ? (
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                تسویه شده
                                            </span>
                                        ) : item.paymentStatus === 'PARTIAL' ? (
                                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                علی‌الحساب
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                در صف پرداخت
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                            <tr>
                                <td colSpan={4} className="py-3.5 px-4 text-left">
                                    مجموع کل دستور پرداخت پایا:
                                </td>
                                <td className="py-3.5 px-3 font-mono">
                                    {financeData.totalGross.toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-emerald-600">
                                    {financeData.totalBonus.toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-rose-600">
                                    {financeData.totalDeductions.toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                    {financeData.totalNetPayable.toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 text-slate-400 text-center">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

        </div>
    );
};
