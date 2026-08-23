import React, { useMemo } from 'react';
import { CommissionDeal, CommissionPeriod } from '../../../types';
import { parseSalesPersons } from '../../../services/commissionService';
import { 
    Building2, 
    TrendingUp, 
    DollarSign, 
    Award, 
    CheckCircle, 
    ShieldCheck, 
    Printer, 
    PieChart, 
    ArrowUpRight, 
    Users, 
    Percent, 
    Scale, 
    Zap,
    FileCheck,
    Lock
} from 'lucide-react';

interface CommissionCeoViewProps {
    deals: CommissionDeal[];
    activePeriod: CommissionPeriod;
    currencyUnit: 'RIAL' | 'TOMAN';
    onApproveCeo: () => void;
    onOpenPrintReport: (type: 'CEO') => void;
}

export const CommissionCeoView: React.FC<CommissionCeoViewProps> = ({
    deals,
    activePeriod,
    currencyUnit,
    onApproveCeo,
    onOpenPrintReport
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    // Executive Level Computations
    const ceoMetrics = useMemo(() => {
        let totalTurnover = 0;
        let totalGrossProfit = 0;
        let totalCommission = 0;
        let totalPaid = 0;

        const categoryBreakdown: Record<string, { turnover: number; profit: number; commission: number; count: number }> = {
            ANBAR: { turnover: 0, profit: 0, commission: 0, count: 0 },
            AZAD: { turnover: 0, profit: 0, commission: 0, count: 0 },
            HAVALEH: { turnover: 0, profit: 0, commission: 0, count: 0 },
            LEASING: { turnover: 0, profit: 0, commission: 0, count: 0 },
            REGISTRATION: { turnover: 0, profit: 0, commission: 0, count: 0 },
        };

        const staffProfits: Record<string, { profit: number; commission: number; dealsCount: number }> = {};

        deals.forEach(deal => {
            const persons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);
            const share = 1 / (persons.length || 1);

            const turnover = deal.salePrice || deal.downPayment || 0;
            const profit = deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0);
            const comm = deal.commissionAmount || 0;
            const cat = deal.category || 'ANBAR';

            totalTurnover += turnover;
            totalGrossProfit += profit;
            totalCommission += comm;

            if (deal.paymentStatus === 'PAID') {
                totalPaid += deal.paidCommissionShare ?? comm;
            }

            if (categoryBreakdown[cat]) {
                categoryBreakdown[cat].turnover += turnover;
                categoryBreakdown[cat].profit += profit;
                categoryBreakdown[cat].commission += comm;
                categoryBreakdown[cat].count += 1;
            }

            persons.forEach(p => {
                if (!staffProfits[p]) {
                    staffProfits[p] = { profit: 0, commission: 0, dealsCount: 0 };
                }
                const pComm = (deal.customPersonCommissions && deal.customPersonCommissions[p] !== undefined)
                    ? deal.customPersonCommissions[p]
                    : comm * share;

                staffProfits[p].profit += profit * share;
                staffProfits[p].commission += pComm;
                staffProfits[p].dealsCount += share;
            });
        });

        // Net company margin
        const netCompanyMargin = totalGrossProfit - totalCommission;
        const commissionCostRate = totalGrossProfit > 0 ? ((totalCommission / totalGrossProfit) * 100).toFixed(1) : '0';
        const roiFactor = totalCommission > 0 ? (totalGrossProfit / totalCommission).toFixed(1) : '0';

        // Azad Karaneh: (مجموع کمیسیون آزاد - جمع کل پورسانت آزاد) / ۲۵
        const azadProfit = categoryBreakdown.AZAD.profit;
        const azadComm = categoryBreakdown.AZAD.commission;
        const azadSurplus = azadProfit - azadComm;
        const azadKaraneh = Math.round(azadSurplus / 25);

        const top3ProfitableStaff = Object.entries(staffProfits)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 3);

        return {
            totalTurnover: Math.round(totalTurnover / divisor),
            totalGrossProfit: Math.round(totalGrossProfit / divisor),
            totalCommission: Math.round(totalCommission / divisor),
            netCompanyMargin: Math.round(netCompanyMargin / divisor),
            totalPaid: Math.round(totalPaid / divisor),
            azadSurplus: Math.round(azadSurplus / divisor),
            azadKaraneh: Math.round(azadKaraneh / divisor),
            commissionCostRate,
            roiFactor,
            dealsCount: deals.length,
            categoryBreakdown,
            top3ProfitableStaff
        };
    }, [deals, divisor]);

    const isCeoApproved = Boolean(activePeriod.approvals?.ceoApproved);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* Executive Status Header */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-400/30">
                            <Building2 className="w-3.5 h-3.5" />
                            داشبورد راهبردی و تصمیم‌گیری مدیرعامل
                        </div>
                        <h2 className="text-xl font-black text-white">
                            خلاصه سودآوری، گردش نقدینگی و هزینه پورسانت ({activePeriod.title})
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                            تحلیل نسبت ارزش‌آفرینی تیم فروش، سهم سود خالص شرکت و کنترل نهایی اسناد پرداخت
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => onOpenPrintReport('CEO')}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ گزارش رسمی مدیرعامل
                        </button>

                        <button
                            onClick={onApproveCeo}
                            className={`px-5 py-2.5 text-xs font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                                isCeoApproved
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/30'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {isCeoApproved ? 'تأیید و ابلاغ شده توسط مدیرعامل' : 'تأیید نهایی و ابلاغ دستور پرداخت'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Strategic KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Turnover (گردش کل فروش) */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">ارزش کل معاملات دوره (GMV)</span>
                    <div className="font-mono font-black text-2xl text-slate-800 dark:text-white">
                        {ceoMetrics.totalTurnover.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>تعداد قراردادها: {ceoMetrics.dealsCount} فقره</span>
                        <span className="text-emerald-600 font-bold">۱۰۰٪ پوشش</span>
                    </div>
                </div>

                {/* 2. Gross Profit Generated */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">سود ناخالص خلق‌شده برای مجموعه</span>
                    <div className="font-mono font-black text-2xl text-amber-600 dark:text-amber-400">
                        {ceoMetrics.totalGrossProfit.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>سود انبار + کمیسیون آزاد + حواله</span>
                    </div>
                </div>

                {/* 3. Commission Payout Cost */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">کل هزینه پورسانت پرسنل</span>
                    <div className="font-mono font-black text-2xl text-indigo-600 dark:text-indigo-400">
                        {ceoMetrics.totalCommission.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>سهم از سود: <b>{ceoMetrics.commissionCostRate}٪</b></span>
                        <span className="text-teal-600 font-bold">بازدهی: {ceoMetrics.roiFactor}x</span>
                    </div>
                </div>

                {/* 4. Net Company Margin */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-emerald-300 dark:border-emerald-900/40 shadow-sm">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        سود خالص باقی‌مانده شرکت (Net Gain)
                    </span>
                    <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {ceoMetrics.netCompanyMargin.toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                        سود ناخالص پس از کسر تمامی پورسانت‌ها و تعدیلات
                    </p>
                </div>

            </div>

            {/* Department Breakdown & Top 3 Most Profitable Contributors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Category Distribution (سودآوری ۵ بخش عملیاتی) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white">
                                تفکیک ارزش‌آفرینی به تفکیک خطوط فروش (شیت‌های ۵ گانه)
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {[
                            { name: 'فروش انبار خودرو', data: ceoMetrics.categoryBreakdown.ANBAR, color: 'bg-emerald-500', rate: '۰.۰۵٪ فروش' },
                            { name: 'فروش آزاد و واسطه‌ای', data: ceoMetrics.categoryBreakdown.AZAD, color: 'bg-indigo-500', rate: '۱۰٪ کمیسیون' },
                            { name: 'فروش حواله', data: ceoMetrics.categoryBreakdown.HAVALEH, color: 'bg-amber-500', rate: '۰.۰۵٪ فروش' },
                            { name: 'لیزینگ و اقساطی', data: ceoMetrics.categoryBreakdown.LEASING, color: 'bg-teal-500', rate: '۰.۱٪ پیش‌پرداخت' },
                            { name: 'ثبت‌نام کارخانه', data: ceoMetrics.categoryBreakdown.REGISTRATION, color: 'bg-rose-500', rate: 'کارمزد مصوب' },
                        ].map(item => (
                            <div key={item.name} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{item.data.count} معامله</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-[11px]">حجم فروش:</span>
                                        <span className="font-mono font-bold">{Math.round(item.data.turnover / divisor).toLocaleString('fa-IR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-[11px]">سود شرکت:</span>
                                        <span className="font-mono font-bold text-amber-600">{Math.round(item.data.profit / divisor).toLocaleString('fa-IR')}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-400 text-[11px]">پورسانت تیم:</span>
                                        <span className="font-mono font-black text-indigo-600">{Math.round(item.data.commission / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                    </div>
                                    {item.name.includes('آزاد') && (
                                        <div className="flex justify-between pt-1 bg-amber-50 dark:bg-amber-950/40 -mx-2 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                                            <span className="text-amber-800 dark:text-amber-300 text-[11px] font-bold">کارانه فروش آزاد (سهم ۱/۲۵):</span>
                                            <span className="font-mono font-black text-amber-700 dark:text-amber-300">{ceoMetrics.azadKaraneh.toLocaleString('fa-IR')} {unitLabel}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Top 3 Most Profitable Staff for CEO */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <Award className="w-5 h-5 text-amber-500" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white">
                                سودآورترین کارشناسان برای شرکت
                            </h3>
                        </div>

                        <div className="space-y-4 pt-4">
                            {ceoMetrics.top3ProfitableStaff.map((staff, idx) => (
                                <div key={staff.name} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center ${
                                            idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                                                {staff.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {staff.dealsCount} قرارداد • پورسانت: {Math.round(staff.commission / divisor).toLocaleString('fa-IR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                                        +{Math.round(staff.profit / divisor).toLocaleString('fa-IR')}
                                        <span className="text-[9px] font-sans block text-slate-400">{unitLabel} سود</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300">
                            <b>💡 شاخص بازگشت سرمایه (ROI):</b> به ازای هر ۱ ریال پورسانت پرداختی به تیم، <b>{ceoMetrics.roiFactor} ریال</b> سود خالص برای گروه حسینی محقق شده است.
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};
