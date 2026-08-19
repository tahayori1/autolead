import React, { useState } from 'react';
import { CommissionDeal, CommissionPeriod } from '../../../types';
import { parseSalesPersons } from '../../../services/commissionService';
import { 
    X, 
    Printer, 
    Building2, 
    FileText, 
    Award, 
    DollarSign, 
    CheckCircle, 
    ShieldCheck, 
    Calendar,
    Users,
    Layers,
    CheckSquare,
    Square
} from 'lucide-react';

export type ReportRoleType = 'CEO' | 'SALES_MANAGER' | 'FINANCE' | 'STAFF';

interface CommissionRoleReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportType: ReportRoleType;
    activePeriod: CommissionPeriod;
    allPeriods?: CommissionPeriod[];
    deals: CommissionDeal[];
    allDeals?: CommissionDeal[];
    currencyUnit: 'RIAL' | 'TOMAN';
    targetStaffName?: string;
}

export const CommissionRoleReportsModal: React.FC<CommissionRoleReportsModalProps> = ({
    isOpen,
    onClose,
    reportType,
    activePeriod,
    allPeriods = [activePeriod],
    deals,
    allDeals = deals,
    currencyUnit,
    targetStaffName = 'درسا محمدی'
}) => {
    // Multi-period state
    const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([activePeriod.id]);

    if (!isOpen) return null;

    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    // Toggle single period in multi-select
    const handleTogglePeriod = (pId: string) => {
        setSelectedPeriodIds(prev => {
            if (prev.includes(pId)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(id => id !== pId);
            } else {
                return [...prev, pId];
            }
        });
    };

    const handleSelectAllPeriods = (selectAll: boolean) => {
        if (selectAll) {
            setSelectedPeriodIds(allPeriods.map(p => p.id));
        } else {
            setSelectedPeriodIds([activePeriod.id]);
        }
    };

    // Filter deals matching the selected periods
    const currentDeals = allDeals.filter(d => selectedPeriodIds.includes(d.periodId));

    // Summary calculations across selected periods
    let totalSales = 0;
    let totalGrossProfit = 0;
    let totalCommission = 0;
    const staffMap: Record<string, {
        name: string;
        dealsCount: number;
        salesVolume: number;
        grossProfit: number;
        commission: number;
        anbar: number;
        azad: number;
        havaleh: number;
        leasing: number;
        registration: number;
        bonus: number;
        deductions: number;
        netPayable: number;
    }> = {};

    // Combine adjustments for selected periods
    const combinedAdjustments: Record<string, { bonus: number; deductions: number }> = {};
    allPeriods.filter(p => selectedPeriodIds.includes(p.id)).forEach(p => {
        if (p.adjustments) {
            Object.entries(p.adjustments).forEach(([staff, adj]) => {
                if (!combinedAdjustments[staff]) {
                    combinedAdjustments[staff] = { bonus: 0, deductions: 0 };
                }
                const typedAdj = adj as { bonus?: number; deductions?: number } | undefined;
                if (typedAdj) {
                    combinedAdjustments[staff].bonus += (typedAdj.bonus || 0);
                    combinedAdjustments[staff].deductions += (typedAdj.deductions || 0);
                }
            });
        }
    });

    currentDeals.forEach(deal => {
        const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0 
            ? deal.sharedPersons 
            : parseSalesPersons(deal.salesPerson);
        const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || 'نامشخص'];
        const share = 1 / staffList.length;

        const s = (deal.salePrice || deal.downPayment || 0) * share;
        const p = (deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0)) * share;
        const c = (deal.commissionAmount || 0) * share;
        const cat = deal.category || 'ANBAR';

        totalSales += s * staffList.length;
        totalGrossProfit += p * staffList.length;
        totalCommission += c * staffList.length;

        staffList.forEach(name => {
            if (!staffMap[name]) {
                const adj = combinedAdjustments[name] || { bonus: 0, deductions: 0 };
                staffMap[name] = {
                    name,
                    dealsCount: 0,
                    salesVolume: 0,
                    grossProfit: 0,
                    commission: 0,
                    anbar: 0,
                    azad: 0,
                    havaleh: 0,
                    leasing: 0,
                    registration: 0,
                    bonus: adj.bonus || 0,
                    deductions: adj.deductions || 0,
                    netPayable: 0
                };
            }

            staffMap[name].dealsCount += share;
            staffMap[name].salesVolume += s;
            staffMap[name].grossProfit += p;
            staffMap[name].commission += c;

            if (cat === 'ANBAR') staffMap[name].anbar += c;
            else if (cat === 'AZAD') staffMap[name].azad += c;
            else if (cat === 'HAVALEH') staffMap[name].havaleh += c;
            else if (cat === 'LEASING') staffMap[name].leasing += c;
            else if (cat === 'REGISTRATION') staffMap[name].registration += c;
        });
    });

    const staffList = Object.values(staffMap).map(item => {
        item.netPayable = Math.max(0, (item.commission + item.bonus) - item.deductions);
        return item;
    }).sort((a, b) => b.netPayable - a.netPayable);

    const targetStaffData = staffMap[targetStaffName] || {
        name: targetStaffName,
        dealsCount: 0,
        salesVolume: 0,
        grossProfit: 0,
        commission: 0,
        anbar: 0,
        azad: 0,
        havaleh: 0,
        leasing: 0,
        registration: 0,
        bonus: 0,
        deductions: 0,
        netPayable: 0
    };

    const targetStaffDeals = currentDeals.filter(d => (d.salesPerson || '').includes(targetStaffName));

    const selectedPeriodNames = allPeriods
        .filter(p => selectedPeriodIds.includes(p.id))
        .map(p => p.title)
        .join(' + ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 sm:p-8 my-8 relative">
                
                {/* Close & Print Buttons */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 print:hidden">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            پیش‌نمایش سند رسمی چاپی • {
                                reportType === 'CEO' ? 'گزارش راهبردی مدیرعامل' :
                                reportType === 'SALES_MANAGER' ? 'گزارش ارزیابی عملکرد مدیر فروش' :
                                reportType === 'FINANCE' ? 'دستور پرداخت و سند حسابداری مالی' :
                                `فیش حقوقی و پورسانت (${targetStaffName})`
                            }
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ سند رسمی (A4)
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Multi-Period Selector Bar (Interactive in UI, hidden in Print) */}
                <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            انتخاب دوره‌های مالی برای گزارش‌دهی:
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                            {allPeriods.map(p => {
                                const isSelected = selectedPeriodIds.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleTogglePeriod(p.id)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                            isSelected 
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                        }`}
                                    >
                                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                                        {p.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => handleSelectAllPeriods(true)}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                            انتخاب همه (تجمعی)
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                            type="button"
                            onClick={() => handleSelectAllPeriods(false)}
                            className="text-slate-500 font-bold hover:underline"
                        >
                            فقط دوره جاری
                        </button>
                    </div>
                </div>

                {/* Print Sheet Container */}
                <div className="space-y-6 text-slate-900 bg-white p-6 rounded-2xl border border-slate-100 print:p-0 print:border-0" id="official-report-content">
                    
                    {/* Header Banner with Official Branding */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-xl font-black text-xl">
                                H
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-slate-900">
                                    گروه خودرویی حسینی • دپارتمان فروش و مالی
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    سامانه یکپارچه مدیریت معاملات و تسویه کمیسیون و پورسانت
                                </p>
                            </div>
                        </div>

                        <div className="text-left text-xs space-y-1 font-mono">
                            <div>
                                <span className="text-slate-500">دوره مالی: </span>
                                <span className="font-bold font-sans">{selectedPeriodNames} {selectedPeriodIds.length > 1 ? `(${selectedPeriodIds.length} دوره تجمعی)` : ''}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">تاریخ گزارش: </span>
                                <span className="font-bold">۱۴۰۵/۰۵/۳۱</span>
                            </div>
                            <div>
                                <span className="text-slate-500">کد سند: </span>
                                <span className="font-bold">HK-COMM-{reportType}-{selectedPeriodIds.join('-')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Report Specific Content */}
                    
                    {/* 1. CEO Strategic Report */}
                    {reportType === 'CEO' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-600" />
                                    خلاصه شاخص‌های کلیدی عملکرد (KPIs)
                                </h3>
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-[11px] text-slate-500 block">حجم کل فروش (GMV)</span>
                                        <span className="text-base font-black font-mono text-slate-900">
                                            {Math.round(totalSales / divisor).toLocaleString('fa-IR')} {unitLabel}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-[11px] text-slate-500 block">سود ناخالص / ارزش افزوده</span>
                                        <span className="text-base font-black font-mono text-emerald-600">
                                            {Math.round(totalGrossProfit / divisor).toLocaleString('fa-IR')} {unitLabel}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-[11px] text-slate-500 block">کل پورسانت تعهد شده</span>
                                        <span className="text-base font-black font-mono text-indigo-600">
                                            {Math.round(totalCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-[11px] text-slate-500 block">تعداد کل معاملات</span>
                                        <span className="text-base font-black font-mono text-slate-900">
                                            {currentDeals.length} فقره
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Ranking Table */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 mb-2">رتبه‌بندی راهبردی پرسنل و سهم از پورسانت</h4>
                                <table className="w-full text-xs text-right border border-slate-200 rounded-xl overflow-hidden">
                                    <thead className="bg-slate-100 font-bold text-slate-700">
                                        <tr>
                                            <th className="p-2.5">رتبه</th>
                                            <th className="p-2.5">نام کارشناس فروش</th>
                                            <th className="p-2.5 text-center">تعداد معاملات</th>
                                            <th className="p-2.5">حجم فروش</th>
                                            <th className="p-2.5">سود ناخالص تولیدی</th>
                                            <th className="p-2.5">پورسانت خالص نهایی</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-mono">
                                        {staffList.map((st, idx) => (
                                            <tr key={st.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="p-2.5 font-bold text-center">{idx + 1}</td>
                                                <td className="p-2.5 font-sans font-bold">{st.name}</td>
                                                <td className="p-2.5 text-center">{st.dealsCount}</td>
                                                <td className="p-2.5">{Math.round(st.salesVolume / divisor).toLocaleString('fa-IR')}</td>
                                                <td className="p-2.5 text-emerald-700 font-bold">{Math.round(st.grossProfit / divisor).toLocaleString('fa-IR')}</td>
                                                <td className="p-2.5 text-indigo-700 font-black">{Math.round(st.netPayable / divisor).toLocaleString('fa-IR')} {unitLabel}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. Sales Manager Report */}
                    {reportType === 'SALES_MANAGER' && (
                        <div className="space-y-6">
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <h3 className="text-sm font-black text-slate-800 mb-2">
                                    تفکیک فروش و کمیسیون به تفکیک دسته‌بندی‌ها
                                </h3>
                                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                    <div className="bg-white p-2.5 rounded-lg border">
                                        <span className="text-slate-500 block text-[10px]">فروش انبار</span>
                                        <span className="font-bold font-mono text-emerald-700">
                                            {currentDeals.filter(d => d.category === 'ANBAR').length} فقره
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border">
                                        <span className="text-slate-500 block text-[10px]">فروش آزاد</span>
                                        <span className="font-bold font-mono text-indigo-700">
                                            {currentDeals.filter(d => d.category === 'AZAD').length} فقره
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border">
                                        <span className="text-slate-500 block text-[10px]">فروش حواله</span>
                                        <span className="font-bold font-mono text-cyan-700">
                                            {currentDeals.filter(d => d.category === 'HAVALEH').length} فقره
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border">
                                        <span className="text-slate-500 block text-[10px]">لیزینگ</span>
                                        <span className="font-bold font-mono text-purple-700">
                                            {currentDeals.filter(d => d.category === 'LEASING').length} فقره
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border">
                                        <span className="text-slate-500 block text-[10px]">ثبت‌نام</span>
                                        <span className="font-bold font-mono text-amber-700">
                                            {currentDeals.filter(d => d.category === 'REGISTRATION').length} فقره
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Deal Log */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 mb-2">لیست تفصیلی قراردادهای ثبت شده دوره</h4>
                                <table className="w-full text-[11px] text-right border border-slate-200 rounded-xl overflow-hidden">
                                    <thead className="bg-slate-100 font-bold text-slate-700">
                                        <tr>
                                            <th className="p-2">#</th>
                                            <th className="p-2">دسته</th>
                                            <th className="p-2">تاریخ</th>
                                            <th className="p-2">پرسنل فروش</th>
                                            <th className="p-2">خریدار</th>
                                            <th className="p-2">خودرو</th>
                                            <th className="p-2">نرخ فروش</th>
                                            <th className="p-2">پورسانت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-mono">
                                        {currentDeals.slice(0, 25).map((d, i) => (
                                            <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="p-2 font-bold text-center">{i + 1}</td>
                                                <td className="p-2 font-sans font-bold text-[10px]">
                                                    {d.category === 'ANBAR' ? 'انبار' : d.category === 'AZAD' ? 'آزاد' : d.category === 'HAVALEH' ? 'حواله' : d.category === 'LEASING' ? 'لیزینگ' : 'ثبت نام'}
                                                </td>
                                                <td className="p-2">{d.saleDate}</td>
                                                <td className="p-2 font-sans font-bold">{d.salesPerson}</td>
                                                <td className="p-2 font-sans">{d.customerName}</td>
                                                <td className="p-2 font-sans">{d.carModel}</td>
                                                <td className="p-2">{Math.round(d.salePrice / divisor).toLocaleString('fa-IR')}</td>
                                                <td className="p-2 font-bold text-emerald-700">{Math.round(d.commissionAmount / divisor).toLocaleString('fa-IR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. Finance & Accounting Disbursement Order */}
                    {reportType === 'FINANCE' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-emerald-950">سند دستور واریز و تسویه پورسانت پرسنل</h3>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        تأییدیه واحد مالی جهت پرداخت به حساب شبای کارشناسان فروش
                                    </p>
                                </div>
                                <div className="text-left font-mono">
                                    <span className="text-xs text-emerald-800 block font-sans">مجموع نهایی قابل پرداخت:</span>
                                    <span className="text-lg font-black text-emerald-900">
                                        {Math.round(staffList.reduce((sum, s) => sum + s.netPayable, 0) / divisor).toLocaleString('fa-IR')} {unitLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Payroll Table */}
                            <table className="w-full text-xs text-right border border-slate-200 rounded-xl overflow-hidden">
                                <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                        <th className="p-2.5">ردیف</th>
                                        <th className="p-2.5">نام کارمند</th>
                                        <th className="p-2.5 text-center">تعداد</th>
                                        <th className="p-2.5">مبلغ خام پورسانت</th>
                                        <th className="p-2.5">پاداش (+)</th>
                                        <th className="p-2.5">کسورات (-)</th>
                                        <th className="p-2.5">خالص پرداختی</th>
                                        <th className="p-2.5">وضعیت تسویه</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-mono">
                                    {staffList.map((st, i) => (
                                        <tr key={st.name} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                            <td className="p-2.5 font-bold text-center">{i + 1}</td>
                                            <td className="p-2.5 font-sans font-bold">{st.name}</td>
                                            <td className="p-2.5 text-center">{st.dealsCount}</td>
                                            <td className="p-2.5">{Math.round(st.commission / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2.5 text-emerald-700">{Math.round(st.bonus / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2.5 text-rose-700">{Math.round(st.deductions / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2.5 font-black text-slate-900 text-sm">
                                                {Math.round(st.netPayable / divisor).toLocaleString('fa-IR')} {unitLabel}
                                            </td>
                                            <td className="p-2.5 font-sans">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                    تأیید پرداخت
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. Staff Individual Payslip */}
                    {reportType === 'STAFF' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        فیش تفصیلی پورسانت و کارمزد: {targetStaffName}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        کارشناس ارشد فروش و بازاریابی خودرو
                                    </p>
                                </div>
                                <div className="text-left font-mono">
                                    <span className="text-xs text-slate-500 block font-sans">تعداد قراردادهای موفق:</span>
                                    <span className="text-lg font-black text-slate-900">{targetStaffData.dealsCount} معامله</span>
                                </div>
                            </div>

                            {/* Staff Category Breakdown */}
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>فروش انبار:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.anbar / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>فروش آزاد:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.azad / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>فروش حواله:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.havaleh / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                            </div>

                            {/* Net Payable Highlight */}
                            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-emerald-900 block text-xs">مبلغ نهایی قابل پرداخت به مشاور:</span>
                                    <span className="text-[10px] text-emerald-700">با احتساب پاداش و کسر قانونی</span>
                                </div>
                                <div className="font-mono font-black text-2xl text-emerald-700">
                                    {Math.round(targetStaffData.netPayable / divisor).toLocaleString('fa-IR')} {unitLabel}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Official Signatures Quad-Box */}
                    <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-xs">
                        <div className="space-y-12">
                            <span className="font-bold text-slate-700 block">کارشناس فروش (ذینفع)</span>
                            <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1">امضا و تاریخ</div>
                        </div>

                        <div className="space-y-12">
                            <span className="font-bold text-slate-700 block">مدیر فروش</span>
                            <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1">امضا و مهر تأیید فنی</div>
                        </div>

                        <div className="space-y-12">
                            <span className="font-bold text-slate-700 block">مدیر مالی و حسابداری</span>
                            <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1">امضا و تأیید سند تسویه</div>
                        </div>

                        <div className="space-y-12">
                            <span className="font-bold text-slate-700 block">مدیرعامل</span>
                            <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1">امضا و ابلاغ نهایی</div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
