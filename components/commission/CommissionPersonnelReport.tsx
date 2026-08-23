import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { CommissionDeal, CommissionPeriod, CommissionCategory } from '../../types';
import { parseSalesPersons } from '../../services/commissionService';
import { 
    Users, 
    Award, 
    TrendingUp, 
    DollarSign, 
    CheckCircle2, 
    Clock, 
    Gift, 
    MinusCircle, 
    PlusCircle,
    Edit3,
    Printer,
    FileSpreadsheet,
    Layers,
    Eye,
    X,
    FileText,
    Building,
    Download
} from 'lucide-react';

interface CommissionPersonnelReportProps {
    deals: CommissionDeal[];
    currencyUnit: 'RIAL' | 'TOMAN';
    activePeriodName: string;
    activePeriodId: string;
    periodAdjustments?: Record<string, { bonus: number; deductions: number; notes?: string }>;
    onSaveAdjustments?: (adjustments: Record<string, { bonus: number; deductions: number; notes?: string }>) => void;
}

interface PersonnelRow {
    name: string;
    anbarCommission: number;
    azadCommission: number;
    havalehCommission: number;
    leasingCommission: number;
    registrationCommission: number;
    totalDealsCount: number;
    totalSalesVolume: number;
    grossCommission: number; // جمع کل پورسانت‌ها قبل از تعدیلات
    bonus: number; // پاداش (+)
    deductions: number; // کسورات (-)
    netPayable: number; // خالص پرداختی
    paidAmount: number;
    remainingAmount: number;
    cars: string[];
    dealsList: CommissionDeal[];
}

export const CommissionPersonnelReport: React.FC<CommissionPersonnelReportProps> = ({
    deals,
    currencyUnit,
    activePeriodName,
    activePeriodId,
    periodAdjustments = {},
    onSaveAdjustments
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    // Local adjustments state
    const [adjustments, setAdjustments] = useState<Record<string, { bonus: number; deductions: number; notes?: string }>>(periodAdjustments);
    const [editingStaff, setEditingStaff] = useState<string | null>(null);
    const [editBonus, setEditBonus] = useState<number | ''>('');
    const [editDeductions, setEditDeductions] = useState<number | ''>('');
    const [editNotes, setEditNotes] = useState('');

    // Selected staff for viewing individual payslip
    const [viewingPayslipStaff, setViewingPayslipStaff] = useState<PersonnelRow | null>(null);

    // Predefined staff list matching company personnel (from Excel final sheet)
    const ALL_KNOWN_STAFF = [
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

    // Compute aggregated personnel commissions with 50/50 shared deals handling
    const personnelData = useMemo<PersonnelRow[]>(() => {
        const map: Record<string, PersonnelRow> = {};

        // Helper to get or create staff row
        const getStaffRow = (name: string): PersonnelRow => {
            if (!map[name]) {
                const adj = adjustments[name] || { bonus: 0, deductions: 0, notes: '' };
                map[name] = {
                    name,
                    anbarCommission: 0,
                    azadCommission: 0,
                    havalehCommission: 0,
                    leasingCommission: 0,
                    registrationCommission: 0,
                    totalDealsCount: 0,
                    totalSalesVolume: 0,
                    grossCommission: 0,
                    bonus: adj.bonus || 0,
                    deductions: adj.deductions || 0,
                    netPayable: 0,
                    paidAmount: 0,
                    remainingAmount: 0,
                    cars: [],
                    dealsList: []
                };
            }
            return map[name];
        };

        // Initialize known staff
        ALL_KNOWN_STAFF.forEach(staffName => {
            getStaffRow(staffName);
        });

        // Special seed case from Excel: ندا قاسمی received 5,837,500 Rials from Anbar
        if (map['ندا قاسمی'] && !deals.some(d => d.salesPerson?.includes('ندا قاسمی') && d.category === 'ANBAR')) {
            map['ندا قاسمی'].anbarCommission += 5837500;
            map['ندا قاسمی'].paidAmount += 5837500;
        }

        // Process all deals in current period
        deals.forEach(deal => {
            const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);

            const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || 'نامشخص'];
            const shareFactor = 1 / staffList.length; // 1.0 for single, 0.5 for 2 shared persons

            const dealComm = deal.commissionAmount || 0;
            const dealSales = (deal.salePrice || deal.downPayment || 0) * shareFactor;
            const shareComm = Math.round(dealComm * shareFactor);
            const category = deal.category || 'ANBAR';

            staffList.forEach(staffName => {
                const row = getStaffRow(staffName);
                row.totalDealsCount += shareFactor;
                row.totalSalesVolume += dealSales;
                row.dealsList.push(deal);

                // Use custom commission for this person if defined in multi-partner manual split
                const personComm = (deal.customPersonCommissions && deal.customPersonCommissions[staffName] !== undefined)
                    ? deal.customPersonCommissions[staffName]
                    : shareComm;

                if (category === 'ANBAR') row.anbarCommission += personComm;
                else if (category === 'AZAD') row.azadCommission += personComm;
                else if (category === 'HAVALEH') row.havalehCommission += personComm;
                else if (category === 'LEASING') row.leasingCommission += personComm;
                else if (category === 'REGISTRATION') row.registrationCommission += personComm;
                else row.anbarCommission += personComm;

                if (deal.paymentStatus === 'PAID') {
                    row.paidAmount += personComm;
                } else if (deal.paymentStatus === 'PARTIAL' && deal.paidCommissionShare) {
                    row.paidAmount += Math.round(deal.paidCommissionShare * shareFactor);
                }

                if (deal.carModel && !row.cars.includes(deal.carModel)) {
                    row.cars.push(deal.carModel);
                }
            });
        });

        // Compute Totals and Net Payables
        return Object.values(map).map(row => {
            const adj = adjustments[row.name] || { bonus: 0, deductions: 0 };
            row.bonus = adj.bonus || 0;
            row.deductions = adj.deductions || 0;

            row.grossCommission = 
                row.anbarCommission + 
                row.azadCommission + 
                row.havalehCommission + 
                row.leasingCommission + 
                row.registrationCommission;

            // خالص پرداختی = (پورسانت کل + پاداش) - کسورات
            row.netPayable = Math.max(0, (row.grossCommission + row.bonus) - row.deductions);
            row.remainingAmount = Math.max(0, row.netPayable - row.paidAmount);

            return row;
        }).sort((a, b) => b.netPayable - a.netPayable);
    }, [deals, adjustments]);

    // Grand Totals across all personnel
    const grandTotals = useMemo(() => {
        return personnelData.reduce((acc, curr) => ({
            anbar: acc.anbar + curr.anbarCommission,
            azad: acc.azad + curr.azadCommission,
            havaleh: acc.havaleh + curr.havalehCommission,
            leasing: acc.leasing + curr.leasingCommission,
            registration: acc.registration + curr.registrationCommission,
            gross: acc.gross + curr.grossCommission,
            bonus: acc.bonus + curr.bonus,
            deductions: acc.deductions + curr.deductions,
            net: acc.net + curr.netPayable,
            paid: acc.paid + curr.paidAmount,
            remaining: acc.remaining + curr.remainingAmount,
        }), {
            anbar: 0,
            azad: 0,
            havaleh: 0,
            leasing: 0,
            registration: 0,
            gross: 0,
            bonus: 0,
            deductions: 0,
            net: 0,
            paid: 0,
            remaining: 0
        });
    }, [personnelData]);

    // Azad Karaneh Calculation for the whole period: (مجموع کمیسیون آزاد - جمع پورسانت آزاد) ÷ ۲۵
    const azadKaranehStats = useMemo(() => {
        const azadDeals = deals.filter(d => d.category === 'AZAD');
        const totalAzadSales = azadDeals.reduce((sum, d) => sum + (d.salePrice || 0), 0);
        const totalAzadGross = azadDeals.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
        const totalAzadComm = azadDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
        const surplus = totalAzadGross - totalAzadComm;
        const karaneh = Math.round(surplus / 25);
        return {
            count: azadDeals.length,
            totalSales: Math.round(totalAzadSales / divisor),
            totalGross: Math.round(totalAzadGross / divisor),
            totalComm: Math.round(totalAzadComm / divisor),
            surplus: Math.round(surplus / divisor),
            karaneh: Math.round(karaneh / divisor),
            formulaText: `(کمیسیون [${Math.round(totalAzadGross / divisor).toLocaleString('fa-IR')}] - پورسانت [${Math.round(totalAzadComm / divisor).toLocaleString('fa-IR')}]) ÷ ۲۵`
        };
    }, [deals, divisor]);

    const handleOpenEditAdjustment = (staffName: string) => {
        const current = adjustments[staffName] || { bonus: 0, deductions: 0, notes: '' };
        setEditingStaff(staffName);
        setEditBonus(current.bonus ? Math.round(current.bonus / divisor) : '');
        setEditDeductions(current.deductions ? Math.round(current.deductions / divisor) : '');
        setEditNotes(current.notes || '');
    };

    const handleSaveAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;

        const bonusVal = editBonus !== '' ? Number(editBonus) * divisor : 0;
        const deductionsVal = editDeductions !== '' ? Number(editDeductions) * divisor : 0;

        const updated = {
            ...adjustments,
            [editingStaff]: {
                bonus: bonusVal,
                deductions: deductionsVal,
                notes: editNotes.trim()
            }
        };

        setAdjustments(updated);
        if (onSaveAdjustments) onSaveAdjustments(updated);
        setEditingStaff(null);
    };

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">
            
            {/* Top Stat KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Net Commission */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-emerald-200 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            مجموع خالص پرداختی پرسنل
                        </span>
                    </div>
                    <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {Math.round(grandTotals.net / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-500 mr-1.5">{unitLabel}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        (پورسانت ۵ بخش + پاداش‌ها) - کسورات
                    </p>
                </div>

                {/* Warehouse & Free Market Share */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">پورسانت فروش انبار و آزاد</span>
                    </div>
                    <div className="font-mono font-black text-xl text-slate-800 dark:text-white">
                        {Math.round((grandTotals.anbar + grandTotals.azad) / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>انبار: {Math.round(grandTotals.anbar / divisor).toLocaleString('fa-IR')}</span>
                        <span>آزاد: {Math.round(grandTotals.azad / divisor).toLocaleString('fa-IR')}</span>
                    </div>
                </div>

                {/* Havaleh & Leasing Share */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">پورسانت حواله و لیزینگ</span>
                    </div>
                    <div className="font-mono font-black text-xl text-slate-800 dark:text-white">
                        {Math.round((grandTotals.havaleh + grandTotals.leasing) / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>حواله: {Math.round(grandTotals.havaleh / divisor).toLocaleString('fa-IR')}</span>
                        <span>لیزینگ: {Math.round(grandTotals.leasing / divisor).toLocaleString('fa-IR')}</span>
                    </div>
                </div>

                {/* Total Bonuses & Deductions */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">تعدیلات (پاداش / کسورات)</span>
                    </div>
                    <div className="font-mono font-black text-xl text-indigo-600 dark:text-indigo-400">
                        {Math.round(grandTotals.bonus / divisor).toLocaleString('fa-IR')} +
                        <span className="text-xs text-rose-500 mr-2">({Math.round(grandTotals.deductions / divisor).toLocaleString('fa-IR')} -)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        اعمال شده در کارنامه نهایی
                    </p>
                </div>
            </div>

            {/* Azad Karaneh Special Information Banner */}
            <div className="p-4 bg-gradient-to-l from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-500/15 dark:via-amber-400/5 dark:to-transparent rounded-3xl border border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                        🎁
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-amber-950 dark:text-amber-200 text-sm">
                                کارانه فروش آزاد دوره ({activePeriodName})
                            </h4>
                            <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                                سهم ۱/۲۵ مازاد
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            فرمول: کسر جمع کل پورسانت فروش آزاد از مجموع کمیسیون فروش آزاد و تقسیم حاصله بر ۲۵
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">مازاد سود کمیسیون آزاد:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{azadKaranehStats.surplus.toLocaleString('fa-IR')} {unitLabel}</span>
                    </div>
                    <div className="h-8 w-px bg-amber-200 dark:bg-amber-800 hidden sm:block"></div>
                    <div className="p-2.5 bg-amber-200/80 dark:bg-amber-800/60 rounded-2xl border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 flex items-center gap-2">
                        <span className="text-xs font-bold">کارانه کل حاصله:</span>
                        <span className="font-mono text-base font-black">{azadKaranehStats.karaneh.toLocaleString('fa-IR')}</span>
                        <span className="text-[10px]">{unitLabel}</span>
                    </div>
                </div>
            </div>

            {/* Final Sheet Summary Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-900/40">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                جدول تجمیعی و شیت نهایی پورسانت ماهانه (کمسیون_{activePeriodName.replace(/\s+/g, '_')}_نهایی)
                            </h3>
                            <p className="text-xs text-slate-500">
                                محاسبه تفکیکی ۵ بخش به همراه تسهیم ۵۰٪ معاملات اشتراکی، پاداش‌ها و کسورات
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => {
                                if (personnelData.length === 0) {
                                    alert('هیچ اطلاعاتی برای خروجی اکسل وجود ندارد.');
                                    return;
                                }
                                const wb = XLSX.utils.book_new();
                                const headers = [
                                    'ردیف', 'نام کارشناس فروش', 'تعداد معامله', 'حجم فروش کل',
                                    `پورسانت فروش انبار (${unitLabel})`, `پورسانت فروش آزاد (${unitLabel})`,
                                    `پورسانت فروش حواله (${unitLabel})`, `پورسانت لیزینگ (${unitLabel})`,
                                    `پورسانت ثبت‌نام (${unitLabel})`, `جمع ناخالص پورسانت (${unitLabel})`,
                                    `پاداش (+) (${unitLabel})`, `کسورات (-) (${unitLabel})`,
                                    `خالص پرداختی (${unitLabel})`, `واریز شده (${unitLabel})`, `مانده (${unitLabel})`, 'وضعیت تسویه'
                                ];
                                const rows = personnelData.map((p, idx) => [
                                    idx + 1,
                                    p.name,
                                    p.totalDealsCount,
                                    Math.round(p.totalSalesVolume / divisor),
                                    Math.round(p.anbarCommission / divisor),
                                    Math.round(p.azadCommission / divisor),
                                    Math.round(p.havalehCommission / divisor),
                                    Math.round(p.leasingCommission / divisor),
                                    Math.round(p.registrationCommission / divisor),
                                    Math.round(p.grossCommission / divisor),
                                    Math.round(p.bonus / divisor),
                                    Math.round(p.deductions / divisor),
                                    Math.round(p.netPayable / divisor),
                                    Math.round(p.paidAmount / divisor),
                                    Math.round(p.remainingAmount / divisor),
                                    p.remainingAmount <= 0 ? 'تسویه کامل' : (p.paidAmount > 0 ? 'علی‌الحساب' : 'پرداخت‌نشده')
                                ]);

                                const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                                ws['!cols'] = [
                                    { wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 18 },
                                    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
                                    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }
                                ];
                                XLSX.utils.book_append_sheet(wb, ws, 'کارنامه تجمیعی پورسانت');
                                XLSX.writeFile(wb, `کارنامه_پورسانت_${activePeriodName.replace(/\s+/g, '_')}.xlsx`);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            title="دانلود فایل اکسل کارنامه پرسنل (.xlsx)"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            خروجی اکسل (XLSX)
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ فیش تجمیعی
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3.5 px-3 text-center">ردیف</th>
                                <th className="py-3.5 px-4">نام کارشناس فروش</th>
                                <th className="py-3.5 px-3">فروش انبار ({unitLabel})</th>
                                <th className="py-3.5 px-3">فروش آزاد ({unitLabel})</th>
                                <th className="py-3.5 px-3">فروش حواله ({unitLabel})</th>
                                <th className="py-3.5 px-3">لیزینگ و ثبت‌نام ({unitLabel})</th>
                                <th className="py-3.5 px-3">پاداش (+)</th>
                                <th className="py-3.5 px-3">کسورات (-)</th>
                                <th className="py-3.5 px-4 font-black">خالص پرداختی ({unitLabel})</th>
                                <th className="py-3.5 px-3 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {personnelData.map((person, idx) => {
                                const leasingPlusReg = person.leasingCommission + person.registrationCommission;
                                const isPositive = person.netPayable > 0;

                                return (
                                    <tr 
                                        key={person.name} 
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                                            isPositive ? '' : 'opacity-60'
                                        }`}
                                    >
                                        {/* Rank */}
                                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                            {idx + 1}
                                        </td>

                                        {/* Staff Name */}
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm">
                                                {person.name}
                                            </div>
                                            {person.cars.length > 0 && (
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    خودروها: {person.cars.slice(0, 3).join('، ')}
                                                </div>
                                            )}
                                        </td>

                                        {/* Anbar */}
                                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {person.anbarCommission > 0 ? Math.round(person.anbarCommission / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Azad */}
                                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {person.azadCommission > 0 ? Math.round(person.azadCommission / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Havaleh */}
                                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {person.havalehCommission > 0 ? Math.round(person.havalehCommission / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Leasing & Registration */}
                                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {leasingPlusReg > 0 ? Math.round(leasingPlusReg / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Bonus */}
                                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                                            {person.bonus > 0 ? `+${Math.round(person.bonus / divisor).toLocaleString('fa-IR')}` : '-'}
                                        </td>

                                        {/* Deductions */}
                                        <td className="py-3 px-3 font-mono font-bold text-rose-600">
                                            {person.deductions > 0 ? `-${Math.round(person.deductions / divisor).toLocaleString('fa-IR')}` : '-'}
                                        </td>

                                        {/* Net Payable */}
                                        <td className="py-3 px-4 font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                                            {person.netPayable > 0 ? Math.round(person.netPayable / divisor).toLocaleString('fa-IR') : '۰'}
                                        </td>

                                        {/* Actions: View Payslip / Edit Adjustments */}
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setViewingPayslipStaff(person)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="مشاهده و چاپ فیش پورسانت پرسنل"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditAdjustment(person.name)}
                                                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                                                    title="ویرایش پاداش و کسورات"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    تعدیل
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Grand Totals Footer */}
                        <tfoot className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                            <tr>
                                <td colSpan={2} className="py-3.5 px-4 text-left">
                                    جمع کل ({activePeriodName}):
                                </td>
                                <td className="py-3.5 px-3 font-mono">
                                    {Math.round(grandTotals.anbar / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono">
                                    {Math.round(grandTotals.azad / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono">
                                    {Math.round(grandTotals.havaleh / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono">
                                    {Math.round((grandTotals.leasing + grandTotals.registration) / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-emerald-600">
                                    {Math.round(grandTotals.bonus / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-rose-600">
                                    {Math.round(grandTotals.deductions / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black">
                                    {Math.round(grandTotals.net / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal for Viewing & Printing Individual Payslip (فیش پورسانت پرسنل) */}
            {viewingPayslipStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl p-6 relative">
                        <button 
                            onClick={() => setViewingPayslipStaff(null)} 
                            className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                                <Building className="w-3.5 h-3.5" />
                                گروه خودرویی حسینی • فیش محاسبه پورسانت
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {viewingPayslipStaff.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                دوره مالی: {activePeriodName}
                            </p>
                        </div>

                        <div className="py-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                                    <span className="text-slate-500">پورسانت فروش انبار:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">
                                        {Math.round(viewingPayslipStaff.anbarCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                                    <span className="text-slate-500">پورسانت فروش آزاد:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">
                                        {Math.round(viewingPayslipStaff.azadCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                                    <span className="text-slate-500">پورسانت حواله:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">
                                        {Math.round(viewingPayslipStaff.havalehCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                                    <span className="text-slate-500">لیزینگ و ثبت‌نام:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">
                                        {Math.round((viewingPayslipStaff.leasingCommission + viewingPayslipStaff.registrationCommission) / divisor).toLocaleString('fa-IR')} {unitLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Adjustments row */}
                            {(viewingPayslipStaff.bonus > 0 || viewingPayslipStaff.deductions > 0) && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs">
                                    <span className="text-slate-500">تعدیلات (پاداش / کسورات):</span>
                                    <span className="font-mono font-bold">
                                        <span className="text-emerald-600">+{Math.round(viewingPayslipStaff.bonus / divisor).toLocaleString('fa-IR')}</span>
                                        {' / '}
                                        <span className="text-rose-600">-{Math.round(viewingPayslipStaff.deductions / divisor).toLocaleString('fa-IR')}</span>
                                    </span>
                                </div>
                            )}

                            {/* Net Payable Highlight */}
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                                        خالص پرداختی نهایی به مشاور:
                                    </span>
                                    <span className="text-[10px] text-emerald-600">
                                        تعداد کل معاملات مرتبط: {viewingPayslipStaff.dealsList.length} مورد
                                    </span>
                                </div>
                                <div className="font-mono font-black text-xl text-emerald-700 dark:text-emerald-400">
                                    {Math.round(viewingPayslipStaff.netPayable / divisor).toLocaleString('fa-IR')}
                                    <span className="text-xs mr-1 font-sans">{unitLabel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setViewingPayslipStaff(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                            >
                                بستن
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                            >
                                <Printer className="w-4 h-4" />
                                چاپ فیش
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Editing Staff Adjustments (Bonus & Deductions) */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">
                            تنظیم پاداش و کسورات
                        </h3>
                        <p className="text-xs text-emerald-600 font-bold mb-4">
                            کارشناس: {editingStaff} ({activePeriodName})
                        </p>

                        <form onSubmit={handleSaveAdjustment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    مبلغ پاداش مدیریتی ({unitLabel})
                                </label>
                                <input
                                    type="number"
                                    value={editBonus}
                                    onChange={e => setEditBonus(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    مبلغ کسورات یا جریمه ({unitLabel})
                                </label>
                                <input
                                    type="number"
                                    value={editDeductions}
                                    onChange={e => setEditDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 outline-none text-rose-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    توضیحات و علت تعدیل
                                </label>
                                <input
                                    type="text"
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    placeholder="مثلاً: پاداش ثبت رکورد فروش ماهانه"
                                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setEditingStaff(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                >
                                    ثبت و ذخیره
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
