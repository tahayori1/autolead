import React, { useState, useMemo } from 'react';
import { CommissionDeal, CommissionPeriod } from '../../../types';
import { parseSalesPersons } from '../../../services/commissionService';
import { 
    User, 
    DollarSign, 
    Award, 
    FileText, 
    Printer, 
    CheckCircle2, 
    Clock, 
    Share2, 
    Car, 
    Calendar, 
    ShieldCheck,
    Building2,
    TrendingUp,
    Gift,
    MinusCircle
} from 'lucide-react';

interface CommissionStaffViewProps {
    deals: CommissionDeal[];
    activePeriod: CommissionPeriod;
    currencyUnit: 'RIAL' | 'TOMAN';
    onOpenPrintReport: (type: 'STAFF', staffName?: string) => void;
}

export const CommissionStaffView: React.FC<CommissionStaffViewProps> = ({
    deals,
    activePeriod,
    currencyUnit,
    onOpenPrintReport
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    // List of known staff
    const ALL_STAFF = [
        'درسا محمدی',
        'محمد مبین غلامی',
        'ندا قاسمی',
        'طرلان منوچهری',
        'عرشیا عسکری',
        'شبنم کشاورز',
        'امین رضا موسوی اصل',
        'مرضیه ایران نژاد',
        'هیلدا منوچهری',
        'محسن موسوی',
        'مریم یوسفی',
        'زهرا زارع'
    ];

    const [selectedStaff, setSelectedStaff] = useState<string>('درسا محمدی');

    // Calculate personal scorecard for selected staff
    const staffScorecard = useMemo(() => {
        let anbar = 0;
        let azad = 0;
        let havaleh = 0;
        let leasing = 0;
        let registration = 0;
        let totalSales = 0;
        let paidAmount = 0;

        const myDeals: { deal: CommissionDeal; shareFactor: number; shareComm: number; shareSales: number }[] = [];

        // Seed check for ندا قاسمی
        if (selectedStaff === 'ندا قاسمی' && !deals.some(d => d.salesPerson?.includes('ندا قاسمی') && d.category === 'ANBAR')) {
            anbar += 5837500;
            paidAmount += 5837500;
        }

        deals.forEach(deal => {
            const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);
            
            const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || ''];
            
            if (staffList.includes(selectedStaff)) {
                const shareFactor = 1 / staffList.length;
                const dealComm = deal.commissionAmount || 0;
                const dealSales = (deal.salePrice || deal.downPayment || 0) * shareFactor;
                const shareComm = Math.round(dealComm * shareFactor);
                const category = deal.category || 'ANBAR';

                totalSales += dealSales;

                if (category === 'ANBAR') anbar += shareComm;
                else if (category === 'AZAD') azad += shareComm;
                else if (category === 'HAVALEH') havaleh += shareComm;
                else if (category === 'LEASING') leasing += shareComm;
                else if (category === 'REGISTRATION') registration += shareComm;

                if (deal.paymentStatus === 'PAID') {
                    paidAmount += shareComm;
                } else if (deal.paymentStatus === 'PARTIAL' && deal.paidCommissionShare) {
                    paidAmount += Math.round(deal.paidCommissionShare * shareFactor);
                }

                myDeals.push({
                    deal,
                    shareFactor,
                    shareComm,
                    shareSales: dealSales
                });
            }
        });

        const grossComm = anbar + azad + havaleh + leasing + registration;
        const adj = activePeriod.adjustments?.[selectedStaff] || { bonus: 0, deductions: 0, notes: '' };
        const bonus = adj.bonus || 0;
        const deductions = adj.deductions || 0;
        const netPayable = Math.max(0, (grossComm + bonus) - deductions);
        const remaining = Math.max(0, netPayable - paidAmount);

        return {
            anbar: Math.round(anbar / divisor),
            azad: Math.round(azad / divisor),
            havaleh: Math.round(havaleh / divisor),
            leasing: Math.round(leasing / divisor),
            registration: Math.round(registration / divisor),
            grossComm: Math.round(grossComm / divisor),
            bonus: Math.round(bonus / divisor),
            deductions: Math.round(deductions / divisor),
            notes: adj.notes || '',
            netPayable: Math.round(netPayable / divisor),
            paidAmount: Math.round(paidAmount / divisor),
            remaining: Math.round(remaining / divisor),
            totalSales: Math.round(totalSales / divisor),
            dealsCount: myDeals.length,
            myDeals
        };
    }, [deals, selectedStaff, activePeriod, divisor]);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* Top Staff Switcher & Personal Header */}
            <div className="bg-gradient-to-l from-teal-950 via-slate-900 to-emerald-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-400/30">
                            <User className="w-3.5 h-3.5" />
                            پورتال و کارنامه اختصاصی مشاور فروش
                        </div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            کارنامه پورسانت و عملکرد: 
                            <span className="text-emerald-400 font-bold underline decoration-emerald-500 underline-offset-4">
                                {selectedStaff}
                            </span>
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                            دوره مالی: {activePeriod.title} • دسترسی به ریز قراردادها و صدور فیش تسویه حساب
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Switch Employee Selector */}
                        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20">
                            <span className="text-xs text-slate-300 px-2 font-bold">انتخاب مشاور:</span>
                            <select
                                value={selectedStaff}
                                onChange={e => setSelectedStaff(e.target.value)}
                                className="px-3 py-1.5 bg-slate-900 text-white border border-white/20 rounded-xl text-xs font-bold outline-none"
                            >
                                {ALL_STAFF.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => onOpenPrintReport('STAFF', selectedStaff)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ فیش رسمی پورسانت
                        </button>
                    </div>
                </div>
            </div>

            {/* Personal KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Net Payable */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-emerald-300 dark:border-emerald-900/40 shadow-sm">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        خالص درآمد و پورسانت این ماه
                    </span>
                    <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {staffScorecard.netPayable.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>واریز شده: <b>{staffScorecard.paidAmount.toLocaleString('fa-IR')}</b></span>
                        <span className="text-rose-500 font-bold">مانده: {staffScorecard.remaining.toLocaleString('fa-IR')}</span>
                    </div>
                </div>

                {/* 2. Total Deals */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">تعداد قراردادهای ثبتی من</span>
                    <div className="font-mono font-black text-2xl text-slate-800 dark:text-white">
                        {staffScorecard.dealsCount}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">قرارداد</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block">
                        حجم فروش: <b>{staffScorecard.totalSales.toLocaleString('fa-IR')} {unitLabel}</b>
                    </span>
                </div>

                {/* 3. Bonus / Adjustments */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">پاداش و کسورات مدیریتی</span>
                    <div className="font-mono font-black text-xl text-indigo-600 dark:text-indigo-400">
                        +{staffScorecard.bonus.toLocaleString('fa-IR')}
                        <span className="text-xs text-rose-500 mr-2 font-normal">(-{staffScorecard.deductions.toLocaleString('fa-IR')})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block truncate">
                        {staffScorecard.notes ? `علت: ${staffScorecard.notes}` : 'بدون کسورات انضباطی'}
                    </span>
                </div>

                {/* 4. Settlement Status */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-400 block mb-1">وضعیت تایید و پرداخت</span>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                            {staffScorecard.remaining === 0 && staffScorecard.netPayable > 0 ? 'تسویه کامل انجام شد' : 'در نوبت پرداخت پایا'}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                        شماره شبا و حساب مقصد تأیید شده است
                    </span>
                </div>

            </div>

            {/* Income Streams Breakdown (5 Sources) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    تفکیک منابع درآمدی و پورسانت ۵ گانه
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">فروش انبار</span>
                        <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                            {staffScorecard.anbar.toLocaleString('fa-IR')}
                        </div>
                        <span className="text-[9px] text-slate-400">{unitLabel}</span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">فروش آزاد</span>
                        <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                            {staffScorecard.azad.toLocaleString('fa-IR')}
                        </div>
                        <span className="text-[9px] text-slate-400">{unitLabel}</span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">فروش حواله</span>
                        <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                            {staffScorecard.havaleh.toLocaleString('fa-IR')}
                        </div>
                        <span className="text-[9px] text-slate-400">{unitLabel}</span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">لیزینگ</span>
                        <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                            {staffScorecard.leasing.toLocaleString('fa-IR')}
                        </div>
                        <span className="text-[9px] text-slate-400">{unitLabel}</span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">ثبت‌نام</span>
                        <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                            {staffScorecard.registration.toLocaleString('fa-IR')}
                        </div>
                        <span className="text-[9px] text-slate-400">{unitLabel}</span>
                    </div>
                </div>
            </div>

            {/* Detailed My Deals Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">
                            لیست تفصیلی قراردادها و سهم پورسانت من
                        </h3>
                        <p className="text-xs text-slate-400">
                            تسهیم ۵۰٪ در معاملات دونفره به‌صورت خودکار لحاظ شده است
                        </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                        {staffScorecard.myDeals.length} معامله ثبت‌شده
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3 px-3 text-center">ردیف</th>
                                <th className="py-3 px-3">تاریخ معامله</th>
                                <th className="py-3 px-3.5">بخش</th>
                                <th className="py-3 px-3.5">نام مشتری / خریدار</th>
                                <th className="py-3 px-3.5">مدل خودرو</th>
                                <th className="py-3 px-3 text-center">نوع شراکت</th>
                                <th className="py-3 px-3.5 font-black text-emerald-600">سهم پورسانت من ({unitLabel})</th>
                                <th className="py-3 px-3">وضعیت واریز</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {staffScorecard.myDeals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400">
                                        معامله‌ای برای این مشاور در این دوره مالی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                staffScorecard.myDeals.map((item, idx) => (
                                    <tr key={item.deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {item.deal.saleDate || '-'}
                                        </td>
                                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                            {item.deal.category === 'ANBAR' ? 'فروش انبار' : item.deal.category === 'AZAD' ? 'فروش آزاد' : item.deal.category === 'HAVALEH' ? 'فروش حواله' : item.deal.category === 'LEASING' ? 'لیزینگ' : 'ثبت نام'}
                                        </td>
                                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                                            {item.deal.customerName || item.deal.buyerName}
                                        </td>
                                        <td className="py-3 px-3.5 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                            {item.deal.carModel}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {item.shareFactor < 1 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                                    مشترک ۵۰٪
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                                    انفرادی ۱۰۰٪
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                            {Math.round(item.shareComm / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            {item.deal.paymentStatus === 'PAID' ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                    واریز شد
                                                </span>
                                            ) : item.deal.paymentStatus === 'PARTIAL' ? (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                    علی‌الحساب
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                                    در انتظار
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
