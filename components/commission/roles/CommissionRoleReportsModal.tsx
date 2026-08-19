import React from 'react';
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
    Users
} from 'lucide-react';

export type ReportRoleType = 'CEO' | 'SALES_MANAGER' | 'FINANCE' | 'STAFF';

interface CommissionRoleReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportType: ReportRoleType;
    activePeriod: CommissionPeriod;
    deals: CommissionDeal[];
    currencyUnit: 'RIAL' | 'TOMAN';
    targetStaffName?: string;
}

export const CommissionRoleReportsModal: React.FC<CommissionRoleReportsModalProps> = ({
    isOpen,
    onClose,
    reportType,
    activePeriod,
    deals,
    currencyUnit,
    targetStaffName = 'درسا محمدی'
}) => {
    if (!isOpen) return null;

    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    // Summary calculations
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

    const adjustments = activePeriod.adjustments || {};

    deals.forEach(deal => {
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
                const adj = adjustments[name] || { bonus: 0, deductions: 0 };
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

    const targetStaffDeals = deals.filter(d => (d.salesPerson || '').includes(targetStaffName));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 sm:p-8 my-8 relative">
                
                {/* Close & Print Buttons */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
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
                            چاپ رسمی سند (Print)
                        </button>

                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-0 print:p-0 print:shadow-none space-y-6">
                    
                    {/* Document Header with Logo & Meta */}
                    <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                                HK
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                    شرکت خودرویی حسینی
                                </h1>
                                <p className="text-xs text-slate-500">
                                    سامانه یکپارچه مدیریت قراردادها، پورسانت و ارزیابی تیم فروش
                                </p>
                            </div>
                        </div>

                        <div className="text-left text-xs space-y-1 font-mono">
                            <div>شماره گزارش: <span className="font-bold">HK-COMM-{activePeriod.id}-01</span></div>
                            <div>دوره مالی: <span className="font-bold">{activePeriod.title}</span></div>
                            <div>تاریخ صدور: <span className="font-bold">{new Date().toLocaleDateString('fa-IR')}</span></div>
                        </div>
                    </div>

                    {/* Report Specific Body */}

                    {/* 1. CEO Strategic Report */}
                    {reportType === 'CEO' && (
                        <div className="space-y-6">
                            <div className="text-center py-2 bg-slate-100 rounded-xl">
                                <h2 className="text-base font-black text-slate-900">
                                    صورت وضعیت جامع سودآوری، گردش نقدینگی و پورسانت دوره
                                </h2>
                            </div>

                            <div className="grid grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">ارزش کل معاملات (GMV)</span>
                                    <span className="font-mono font-black text-sm">{Math.round(totalSales / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">سود ناخالص خلق شده</span>
                                    <span className="font-mono font-black text-sm text-emerald-700">{Math.round(totalGrossProfit / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">کل هزینه پورسانت تیم</span>
                                    <span className="font-mono font-black text-sm text-indigo-700">{Math.round(totalCommission / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                                    <span className="text-emerald-800 font-bold block mb-1">سود خالص شرکت (Net Margin)</span>
                                    <span className="font-mono font-black text-sm text-emerald-800">{Math.round((totalGrossProfit - totalCommission) / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                            </div>

                            {/* Summary Table */}
                            <table className="w-full text-xs text-right border-collapse border border-slate-300">
                                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                                    <tr>
                                        <th className="p-2.5 border-l border-slate-300">ردیف</th>
                                        <th className="p-2.5 border-l border-slate-300">نام کارشناس فروش</th>
                                        <th className="p-2.5 border-l border-slate-300 text-center">تعداد قرارداد</th>
                                        <th className="p-2.5 border-l border-slate-300">حجم فروش ({unitLabel})</th>
                                        <th className="p-2.5 border-l border-slate-300">سود شرکت ({unitLabel})</th>
                                        <th className="p-2.5">پورسانت خالص ({unitLabel})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((s, idx) => (
                                        <tr key={s.name} className="border-b border-slate-200">
                                            <td className="p-2 text-center border-l border-slate-200 font-mono">{idx + 1}</td>
                                            <td className="p-2 font-bold border-l border-slate-200">{s.name}</td>
                                            <td className="p-2 text-center border-l border-slate-200 font-mono">{s.dealsCount}</td>
                                            <td className="p-2 font-mono border-l border-slate-200">{Math.round(s.salesVolume / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono font-bold text-emerald-700 border-l border-slate-200">{Math.round(s.grossProfit / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono font-black text-indigo-700">{Math.round(s.netPayable / divisor).toLocaleString('fa-IR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. Sales Manager Report */}
                    {reportType === 'SALES_MANAGER' && (
                        <div className="space-y-6">
                            <div className="text-center py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-black text-base">
                                کارنامه مدیریتی و ارزیابی تارگت تیم فروش • دوره {activePeriod.title}
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">تعداد کل معاملات</span>
                                    <span className="font-mono font-black text-sm">{deals.length} معامله ثبت‌شده</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">پرسنل فعال فروش</span>
                                    <span className="font-mono font-black text-sm">{staffList.filter(s => s.dealsCount > 0).length} نفر</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="text-slate-500 block mb-1">مجموع پاداش‌های مصوب</span>
                                    <span className="font-mono font-black text-sm text-emerald-600">+{Math.round(staffList.reduce((acc, s) => acc + s.bonus, 0) / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                            </div>

                            <table className="w-full text-xs text-right border-collapse border border-slate-300">
                                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                                    <tr>
                                        <th className="p-2.5 border-l border-slate-300">نام کارشناس</th>
                                        <th className="p-2.5 border-l border-slate-300 text-center">تعداد فروش</th>
                                        <th className="p-2.5 border-l border-slate-300">فروش انبار</th>
                                        <th className="p-2.5 border-l border-slate-300">فروش آزاد</th>
                                        <th className="p-2.5 border-l border-slate-300">حواله و لیزینگ</th>
                                        <th className="p-2.5 border-l border-slate-300">پاداش / کسورات</th>
                                        <th className="p-2.5 font-black">خالص دریافتی ({unitLabel})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((s) => (
                                        <tr key={s.name} className="border-b border-slate-200">
                                            <td className="p-2 font-bold border-l border-slate-200">{s.name}</td>
                                            <td className="p-2 text-center border-l border-slate-200 font-mono">{s.dealsCount}</td>
                                            <td className="p-2 font-mono border-l border-slate-200">{Math.round(s.anbar / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono border-l border-slate-200">{Math.round(s.azad / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono border-l border-slate-200">{Math.round((s.havaleh + s.leasing + s.registration) / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono border-l border-slate-200 text-slate-600">+{Math.round(s.bonus / divisor)} / -{Math.round(s.deductions / divisor)}</td>
                                            <td className="p-2 font-mono font-black text-emerald-700">{Math.round(s.netPayable / divisor).toLocaleString('fa-IR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 3. Finance Manager Report */}
                    {reportType === 'FINANCE' && (
                        <div className="space-y-6">
                            <div className="text-center py-2 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl font-black text-base">
                                دستور پرداخت بانکی و سند تسویه حسابداری پورسانت دوره
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span>شماره سند حسابداری: <b>{activePeriod.approvals?.voucherNumber || `VCH-${activePeriod.id}-01`}</b></span>
                                    <span>سرفصل بدهکار: <b>هزینه پورسانت و کارمزد فروش (کد ۵۱۰۲)</b></span>
                                </div>
                                <div className="flex justify-between">
                                    <span>روش تسویه: <b>دستور پرداخت پایا بانک ملت / پاسارگاد</b></span>
                                    <span>سرفصل بستانکار: <b>جاری کارکنان و مشاوران (کد ۴۰۳)</b></span>
                                </div>
                            </div>

                            <table className="w-full text-xs text-right border-collapse border border-slate-300">
                                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                                    <tr>
                                        <th className="p-2.5 border-l border-slate-300">ردیف</th>
                                        <th className="p-2.5 border-l border-slate-300">نام و نام خانوادگی ذینفع</th>
                                        <th className="p-2.5 border-l border-slate-300">پورسانت ناخالص ({unitLabel})</th>
                                        <th className="p-2.5 border-l border-slate-300">پاداش (+)</th>
                                        <th className="p-2.5 border-l border-slate-300">کسورات (-)</th>
                                        <th className="p-2.5 font-black">مبلغ خالص واریزی ({unitLabel})</th>
                                        <th className="p-2.5 text-center">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.filter(s => s.netPayable > 0).map((s, idx) => (
                                        <tr key={s.name} className="border-b border-slate-200">
                                            <td className="p-2 text-center border-l border-slate-200 font-mono">{idx + 1}</td>
                                            <td className="p-2 font-bold border-l border-slate-200">{s.name}</td>
                                            <td className="p-2 font-mono border-l border-slate-200">{Math.round(s.commission / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono border-l border-slate-200 text-emerald-600">+{Math.round(s.bonus / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono border-l border-slate-200 text-rose-600">-{Math.round(s.deductions / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 font-mono font-black text-emerald-700 border-l border-slate-200">{Math.round(s.netPayable / divisor).toLocaleString('fa-IR')}</td>
                                            <td className="p-2 text-center text-emerald-700 font-bold">آماده پرداخت</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. Staff Individual Payslip */}
                    {reportType === 'STAFF' && (
                        <div className="space-y-6">
                            <div className="text-center py-2 bg-slate-100 rounded-xl font-black text-base text-slate-900">
                                فیش رسمی تسویه حساب و پرداخت پورسانت فروش
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                                <div>نام کارشناس: <b>{targetStaffName}</b></div>
                                <div>سمت: <b>مشاور ارشد فروش</b></div>
                                <div>دوره عملکرد: <b>{activePeriod.title}</b></div>
                                <div>تعداد معاملات مرتبط: <b>{targetStaffDeals.length} فقره</b></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>پورسانت فروش انبار:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.anbar / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>پورسانت فروش آزاد:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.azad / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>پورسانت حواله:</span>
                                    <span className="font-mono font-bold">{Math.round(targetStaffData.havaleh / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                                    <span>لیزینگ و ثبت‌نام:</span>
                                    <span className="font-mono font-bold">{Math.round((targetStaffData.leasing + targetStaffData.registration) / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
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
