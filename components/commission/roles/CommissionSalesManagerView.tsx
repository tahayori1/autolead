import React, { useState, useMemo } from 'react';
import { CommissionDeal, CommissionPeriod } from '../../../types';
import { parseSalesPersons } from '../../../services/commissionService';
import { 
    Users, 
    Target, 
    Award, 
    TrendingUp, 
    Plus, 
    CheckCircle2, 
    Clock, 
    Percent, 
    Zap, 
    Edit3, 
    Printer, 
    FileText, 
    ShieldCheck,
    Share2,
    Search
} from 'lucide-react';

interface CommissionSalesManagerViewProps {
    deals: CommissionDeal[];
    activePeriod: CommissionPeriod;
    currencyUnit: 'RIAL' | 'TOMAN';
    onApproveSales: () => void;
    onOpenNewDeal: () => void;
    onOpenPrintReport: (type: 'SALES_MANAGER') => void;
    onSaveAdjustments?: (adjustments: Record<string, { bonus: number; deductions: number; notes?: string }>) => void;
}

export const CommissionSalesManagerView: React.FC<CommissionSalesManagerViewProps> = ({
    deals,
    activePeriod,
    currencyUnit,
    onApproveSales,
    onOpenNewDeal,
    onOpenPrintReport,
    onSaveAdjustments
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    const [searchQuery, setSearchQuery] = useState('');
    const [monthlyTargetDeals, setMonthlyTargetDeals] = useState<number>(30);

    // Compute sales manager team performance
    const teamStats = useMemo(() => {
        const staffMap: Record<string, {
            name: string;
            dealsCount: number;
            salesVolume: number;
            grossProfit: number;
            commission: number;
            sharedDealsCount: number;
            bonus: number;
            deductions: number;
            netPayable: number;
        }> = {};

        const adjustments = activePeriod.adjustments || {};

        deals.forEach(deal => {
            const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);
            
            const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || 'نامشخص'];
            const shareFactor = 1 / staffList.length;
            const isShared = staffList.length > 1;

            const sales = (deal.salePrice || deal.downPayment || 0) * shareFactor;
            const profit = (deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0)) * shareFactor;
            const comm = (deal.commissionAmount || 0) * shareFactor;

            staffList.forEach(name => {
                if (!staffMap[name]) {
                    const adj = adjustments[name] || { bonus: 0, deductions: 0 };
                    staffMap[name] = {
                        name,
                        dealsCount: 0,
                        salesVolume: 0,
                        grossProfit: 0,
                        commission: 0,
                        sharedDealsCount: 0,
                        bonus: adj.bonus || 0,
                        deductions: adj.deductions || 0,
                        netPayable: 0
                    };
                }

                staffMap[name].dealsCount += shareFactor;
                staffMap[name].salesVolume += sales;
                staffMap[name].grossProfit += profit;
                staffMap[name].commission += comm;
                if (isShared) staffMap[name].sharedDealsCount += 1;
            });
        });

        const list = Object.values(staffMap).map(item => {
            item.netPayable = Math.max(0, (item.commission + item.bonus) - item.deductions);
            return item;
        }).sort((a, b) => b.dealsCount - a.dealsCount);

        const totalDeals = deals.length;
        const totalVolume = list.reduce((sum, s) => sum + s.salesVolume, 0);
        const totalCommission = list.reduce((sum, s) => sum + s.netPayable, 0);
        const targetAchievementRate = monthlyTargetDeals > 0 ? Math.min(100, Math.round((totalDeals / monthlyTargetDeals) * 100)) : 100;

        return {
            list,
            totalDeals,
            totalVolume: Math.round(totalVolume / divisor),
            totalCommission: Math.round(totalCommission / divisor),
            targetAchievementRate,
            activeRepsCount: list.filter(s => s.dealsCount > 0).length
        };
    }, [deals, activePeriod, divisor, monthlyTargetDeals]);

    const isSalesApproved = Boolean(activePeriod.approvals?.salesApproved);

    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return teamStats.list;
        const q = searchQuery.toLowerCase();
        return teamStats.list.filter(s => s.name.toLowerCase().includes(q));
    }, [teamStats.list, searchQuery]);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* Sales Manager Control Bar */}
            <div className="bg-gradient-to-l from-emerald-950 via-slate-900 to-teal-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-400/30">
                            <Users className="w-3.5 h-3.5" />
                            داشبورد هدایت و نظارت مدیر فروش
                        </div>
                        <h2 className="text-xl font-black text-white">
                            ارزیابی و رتبه‌بندی عملکرد تیم فروش ({activePeriod.title})
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                            تارگت ماهانه، نظارت بر تسهیم معاملات مشترک ۵۰٪، تعیین پاداش و تأیید فنی پورسانت‌ها
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={onOpenNewDeal}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            ثبت معامله جدید
                        </button>

                        <button
                            onClick={() => onOpenPrintReport('SALES_MANAGER')}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ گزارش مدیریتی فروش
                        </button>

                        <button
                            onClick={onApproveSales}
                            className={`px-5 py-2.5 text-xs font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                                isSalesApproved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {isSalesApproved ? 'تأیید فنی شده توسط مدیر فروش' : 'تأیید صحت فنی و ارسال به مالی'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sales KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Target Quota Progress */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">تارگت تعداد فروش ماهانه</span>
                        <span className="font-mono text-xs font-black text-emerald-600">{teamStats.targetAchievementRate}٪ تحقق</span>
                    </div>
                    <div className="font-mono font-black text-2xl text-slate-800 dark:text-white">
                        {teamStats.totalDeals} / {monthlyTargetDeals}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">معامله</span>
                    </div>
                    {/* Progress */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full" 
                            style={{ width: `${teamStats.targetAchievementRate}%` }}
                        />
                    </div>
                </div>

                {/* 2. Total Volume */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">گردش مالی فروش مشاوران</span>
                    <div className="font-mono font-black text-2xl text-slate-800 dark:text-white">
                        {teamStats.totalVolume.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block">
                        تعداد مشاوران فعال: <b>{teamStats.activeRepsCount} نفر</b>
                    </span>
                </div>

                {/* 3. Total Team Commission */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">مجموع پورسانت متعلقه به تیم</span>
                    <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {teamStats.totalCommission.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block">
                        خالص بعد از اعمال پاداش و کسورات
                    </span>
                </div>

                {/* 4. Top Performer Highlight */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-amber-300 dark:border-amber-900/40 shadow-sm">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                        🏆 برترین فروشنده ماه از نظر تعداد
                    </span>
                    <div className="font-black text-base text-slate-900 dark:text-white">
                        {teamStats.list[0]?.name || '-'}
                    </div>
                    <div className="font-mono font-black text-lg text-amber-600 mt-1">
                        {teamStats.list[0]?.dealsCount || 0} قرارداد موفق
                    </div>
                </div>

            </div>

            {/* Sales Team Evaluation Matrix */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">
                            جدول عملکردی و تسهیم پورسانت پرسنل فروش
                        </h3>
                        <p className="text-xs text-slate-400">
                            کنترل تعداد معاملات فردی و ۵۰٪ مشترک، پاداش‌های ثبت‌شده و پورسانت خالص
                        </p>
                    </div>

                    <div className="relative min-w-[200px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجوی مشاور..."
                            className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3 px-3 text-center">رتبه</th>
                                <th className="py-3 px-4">نام کارشناس فروش</th>
                                <th className="py-3 px-3 text-center">تعداد قرارداد</th>
                                <th className="py-3 px-3 text-center">معاملات مشترک (۵۰٪)</th>
                                <th className="py-3 px-3.5">حجم فروش ({unitLabel})</th>
                                <th className="py-3 px-3.5">پورسانت پایه ({unitLabel})</th>
                                <th className="py-3 px-3 text-emerald-600">پاداش (+)</th>
                                <th className="py-3 px-3 text-rose-600">کسورات (-)</th>
                                <th className="py-3 px-4 font-black text-emerald-700 dark:text-emerald-300">خالص پورسانت ({unitLabel})</th>
                                <th className="py-3 px-3 text-center">وضعیت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredList.map((staff, idx) => (
                                <tr key={staff.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                        {idx + 1}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                                        {staff.name}
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-white">
                                        {staff.dealsCount > 0 ? staff.dealsCount : '-'}
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono">
                                        {staff.sharedDealsCount > 0 ? (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                                {staff.sharedDealsCount} مورد
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                                        {staff.salesVolume > 0 ? Math.round(staff.salesVolume / divisor).toLocaleString('fa-IR') : '-'}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono font-bold text-slate-600 whitespace-nowrap">
                                        {staff.commission > 0 ? Math.round(staff.commission / divisor).toLocaleString('fa-IR') : '-'}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                                        {staff.bonus > 0 ? `+${Math.round(staff.bonus / divisor).toLocaleString('fa-IR')}` : '-'}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-rose-600 whitespace-nowrap">
                                        {staff.deductions > 0 ? `-${Math.round(staff.deductions / divisor).toLocaleString('fa-IR')}` : '-'}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20">
                                        {staff.netPayable > 0 ? Math.round(staff.netPayable / divisor).toLocaleString('fa-IR') : '۰'}
                                    </td>
                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                        {staff.dealsCount >= 3 ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                تارگت محقق شده
                                            </span>
                                        ) : staff.dealsCount > 0 ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                در حال پیشرفت
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">بدون معامله</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
