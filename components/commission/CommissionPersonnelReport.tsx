import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    CommissionDeal,
    CommissionSettings,
    CommissionPayoutAdjustmentItem
} from '../../types';
import {
    buildPersonnelFinalAndPayoutSummary,
    formatDecimalPercentLabel,
    getCommissionSettings,
    normalizePersonnelName,
    PersonnelFinalRow
} from '../../services/commissionService';
import {
    Award,
    Edit3,
    Printer,
    FileSpreadsheet,
    Eye,
    X,
    Building,
    Download,
    AlertTriangle,
    Coins,
    Wallet,
    Gift
} from 'lucide-react';

interface CommissionPersonnelReportProps {
    deals: CommissionDeal[];
    currencyUnit: 'RIAL' | 'TOMAN';
    activePeriodName: string;
    activePeriodId: string;
    periodAdjustments?: Record<string, { bonus: number; deductions: number; gift?: number; ceremony?: number; notes?: string }>;
    onSaveAdjustments?: (adjustments: Record<string, { bonus: number; deductions: number; gift?: number; ceremony?: number; notes?: string }>) => void;
    periodPayoutExtras?: Record<string, CommissionPayoutAdjustmentItem>;
    onSavePayoutExtras?: (extras: Record<string, CommissionPayoutAdjustmentItem>) => void;
    settings?: CommissionSettings;
}

export const CommissionPersonnelReport: React.FC<CommissionPersonnelReportProps> = ({
    deals,
    currencyUnit,
    activePeriodName,
    activePeriodId,
    periodAdjustments = {},
    onSaveAdjustments,
    periodPayoutExtras = {},
    onSavePayoutExtras,
    settings: customSettings
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';
    const settings = customSettings || getCommissionSettings();

    const [subTab, setSubTab] = useState<'NAHAYI' | 'PAYOUT' | 'KARANEH'>('NAHAYI');

    // Local adjustments state (synced with props)
    const [adjustments, setAdjustments] = useState<Record<string, { bonus: number; deductions: number; gift?: number; ceremony?: number; notes?: string }>>(periodAdjustments);
    const [payoutExtras, setPayoutExtras] = useState<Record<string, CommissionPayoutAdjustmentItem>>(periodPayoutExtras);

    useEffect(() => {
        setAdjustments(periodAdjustments || {});
    }, [periodAdjustments, activePeriodId]);

    useEffect(() => {
        setPayoutExtras(periodPayoutExtras || {});
    }, [periodPayoutExtras, activePeriodId]);

    // Edit Nahayi Adjustment modal
    const [editingStaff, setEditingStaff] = useState<string | null>(null);
    const [editGift, setEditGift] = useState<number | ''>('');
    const [editCeremony, setEditCeremony] = useState<number | ''>('');
    const [editBonus, setEditBonus] = useState<number | ''>('');
    const [editDeductions, setEditDeductions] = useState<number | ''>('');
    const [editNotes, setEditNotes] = useState('');

    // Edit Payout Extras modal
    const [editingPayoutStaff, setEditingPayoutStaff] = useState<string | null>(null);
    const [poGift, setPoGift] = useState<number | ''>('');
    const [poCeremony, setPoCeremony] = useState<number | ''>('');
    const [poT9Backlog, setPoT9Backlog] = useState<number | ''>('');
    const [poOption, setPoOption] = useState<number | ''>('');
    const [poLateReg, setPoLateReg] = useState<number | ''>('');
    const [poOther, setPoOther] = useState<number | ''>('');
    const [poNotes, setPoNotes] = useState('');

    // Payslip modal
    const [viewingPayslipStaff, setViewingPayslipStaff] = useState<PersonnelFinalRow | null>(null);

    const summary = useMemo(() => {
        return buildPersonnelFinalAndPayoutSummary(
            deals,
            {
                id: activePeriodId,
                title: activePeriodName,
                adjustments,
                payoutExtras
            },
            settings
        );
    }, [deals, activePeriodId, activePeriodName, adjustments, payoutExtras, settings]);

    const handleOpenEditAdjustment = (staffName: string) => {
        const norm = normalizePersonnelName(staffName);
        const current = adjustments[norm] || adjustments[staffName] || { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' };
        setEditingStaff(norm);
        setEditGift(current.gift ? Math.round(current.gift / divisor) : '');
        setEditCeremony(current.ceremony ? Math.round(current.ceremony / divisor) : '');
        setEditBonus(current.bonus ? Math.round(current.bonus / divisor) : '');
        setEditDeductions(current.deductions ? Math.round(current.deductions / divisor) : '');
        setEditNotes(current.notes || '');
    };

    const handleSaveAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;

        const updated = {
            ...adjustments,
            [editingStaff]: {
                gift: editGift !== '' ? Number(editGift) * divisor : 0,
                ceremony: editCeremony !== '' ? Number(editCeremony) * divisor : 0,
                bonus: editBonus !== '' ? Number(editBonus) * divisor : 0,
                deductions: editDeductions !== '' ? Number(editDeductions) * divisor : 0,
                notes: editNotes.trim()
            }
        };

        setAdjustments(updated);
        if (onSaveAdjustments) onSaveAdjustments(updated);
        setEditingStaff(null);
    };

    const handleOpenEditPayoutExtras = (staffName: string) => {
        const norm = normalizePersonnelName(staffName);
        const cur = payoutExtras[norm] || payoutExtras[staffName] || {};
        setEditingPayoutStaff(norm);
        setPoGift(cur.gift ? Math.round(cur.gift / divisor) : '');
        setPoCeremony(cur.ceremony ? Math.round(cur.ceremony / divisor) : '');
        setPoT9Backlog(cur.t9Backlog ? Math.round(cur.t9Backlog / divisor) : '');
        setPoOption(cur.optionCommission ? Math.round(cur.optionCommission / divisor) : '');
        setPoLateReg(cur.lateRegistration ? Math.round(cur.lateRegistration / divisor) : '');
        setPoOther(cur.other ? Math.round(cur.other / divisor) : '');
        setPoNotes(cur.notes || '');
    };

    const handleSavePayoutExtras = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPayoutStaff) return;

        const updated: Record<string, CommissionPayoutAdjustmentItem> = {
            ...payoutExtras,
            [editingPayoutStaff]: {
                gift: poGift !== '' ? Number(poGift) * divisor : 0,
                ceremony: poCeremony !== '' ? Number(poCeremony) * divisor : 0,
                t9Backlog: poT9Backlog !== '' ? Number(poT9Backlog) * divisor : 0,
                optionCommission: poOption !== '' ? Number(poOption) * divisor : 0,
                lateRegistration: poLateReg !== '' ? Number(poLateReg) * divisor : 0,
                other: poOther !== '' ? Number(poOther) * divisor : 0,
                notes: poNotes.trim()
            }
        };

        setPayoutExtras(updated);
        if (onSavePayoutExtras) onSavePayoutExtras(updated);
        setEditingPayoutStaff(null);
    };

    const handleExportExcel = () => {
        if (summary.finalRows.length === 0) return;
        const wb = XLSX.utils.book_new();

        // 1. Sheet نهایی
        const finalHeaders = [
            'رتبه', 'نام پرسنل', `انبار (${unitLabel})`, `آزاد (${unitLabel})`, `حواله (${unitLabel})`,
            `ثبت‌نام (${unitLabel})`, `لیزینگ (${unitLabel})`, `جمع پورسانت (${unitLabel})`,
            `هدیه (${unitLabel})`, `مراسم (${unitLabel})`, `پاداش (${unitLabel})`, `کسورات (${unitLabel})`,
            `نهایی (${unitLabel})`, 'توضیحات'
        ];
        const finalSheetRows = summary.finalRows.map(r => [
            r.rank,
            r.staffName,
            Math.round(r.anbarCommission / divisor),
            Math.round(r.azadCommission / divisor),
            Math.round(r.havalehCommission / divisor),
            Math.round(r.registrationCommission / divisor),
            Math.round(r.leasingCommission / divisor),
            Math.round(r.totalSheetCommission / divisor),
            Math.round(r.giftAdjustment / divisor),
            Math.round(r.ceremonyAdjustment / divisor),
            Math.round(r.bonusAdjustment / divisor),
            Math.round(r.deductionsAdjustment / divisor),
            Math.round(r.finalCommission / divisor),
            r.notes || ''
        ]);
        const wsFinal = XLSX.utils.aoa_to_sheet([finalHeaders, ...finalSheetRows]);
        XLSX.utils.book_append_sheet(wb, wsFinal, 'نهایی');

        // 2. Sheet پرداختی
        const holdLabel = settings.payoutHoldMode === 'ADD' ? `+۱۰٪ کمسیون نهایی` : `-۱۰٪ کمسیون نهایی`;
        const payoutHeaders = [
            'رتبه', 'نام پرسنل', `کمسیون نهایی (${unitLabel})`, `هدیه`, `کمسیون T9`,
            `مراسم`, `آپشن`, `ثبت‌نام معوقه`, `سایر`, holdLabel, `نهایی پرداختی (${unitLabel})`, 'توضیحات'
        ];
        const payoutSheetRows = summary.payoutRows.map(p => [
            p.rank,
            p.staffName,
            Math.round(p.finalCommissionFromNahayi / divisor),
            Math.round(p.gift / divisor),
            Math.round(p.t9Backlog / divisor),
            Math.round(p.ceremony / divisor),
            Math.round(p.optionCommission / divisor),
            Math.round(p.lateRegistration / divisor),
            Math.round(p.otherExtras / divisor),
            Math.round(p.tenPercentHold / divisor),
            Math.round(p.finalPayable / divisor),
            p.notes || ''
        ]);
        const wsPayout = XLSX.utils.aoa_to_sheet([payoutHeaders, ...payoutSheetRows]);
        XLSX.utils.book_append_sheet(wb, wsPayout, 'پرداختی');

        // 3. Sheet سهام کارانه
        const kRows: any[][] = [
            ['کارانه کلی (جمع نهایی آزاد)', Math.round(summary.karaneh.totalAzadFinalCommission / divisor), unitLabel],
            ['تعداد بخش', summary.karaneh.sectionCount, 'بخش'],
            ['کارانه هر بخش', Math.round(summary.karaneh.perSectionKaraneh / divisor), unitLabel],
            [''],
            ['دریافت‌کننده', 'نوع', 'درصد / مبلغ ثابت', `سهم محاسبه‌شده (${unitLabel})`]
        ];
        summary.karaneh.recipientShares.forEach(s => {
            kRows.push([
                s.recipientName,
                s.mode === 'FIXED' ? 'مبلغ ثابت' : 'درصد از کارانه هر بخش',
                s.mode === 'FIXED' ? Math.round(s.fixedAmount / divisor) : formatDecimalPercentLabel(s.percent),
                Math.round(s.calculatedAmount / divisor)
            ]);
        });
        const wsKaraneh = XLSX.utils.aoa_to_sheet(kRows);
        XLSX.utils.book_append_sheet(wb, wsKaraneh, 'سهام کارانه');

        XLSX.writeFile(wb, `گزارش_نهایی_پرداختی_کارانه_${activePeriodName.replace(/\s+/g, '_')}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* Warning banners for draft Leasing or flagged unrealistic rows */}
            {(summary.totals.draftLeasingCount > 0 || summary.totals.flaggedUnrealisticCount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.totals.draftLeasingCount > 0 && (
                        <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>
                                <strong>{summary.totals.draftLeasingCount.toLocaleString('fa-IR')} ردیف لیزینگ</strong> به‌دلیل نامشخص/تأییدنشده بودن نرخ لیزینگ در وضعیت <strong>پیش‌نویس</strong> هستند و در جمع قطعی لحاظ نشده‌اند.
                            </span>
                        </div>
                    )}
                    {summary.totals.flaggedUnrealisticCount > 0 && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                                <strong>{summary.totals.flaggedUnrealisticCount.toLocaleString('fa-IR')} ردیف</strong> دارای پرچم «عدد نرخ خرید غیر واقعی است» تا زمان تأیید مدیر از محاسبه نهایی حذف شده‌اند.
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Top Stat KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            جمع شیت «نهایی»
                        </span>
                    </div>
                    <div className="font-mono tabular-nums font-black text-2xl text-emerald-600 dark:text-emerald-400">
                        {Math.round(summary.totals.totalFinalCommission / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-500 mr-1.5">{unitLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        جمع ۵ شیت + تعدیلات (هدیه، مراسم، پاداش، کسورات)
                    </p>
                </div>

                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-indigo-600" />
                            خالص شیت «پرداختی ماهانه»
                        </span>
                    </div>
                    <div className="font-mono tabular-nums font-black text-2xl text-indigo-600 dark:text-indigo-400">
                        {Math.round(summary.totals.totalFinalPayable / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-500 mr-1.5">{unitLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {settings.payoutHoldMode === 'ADD' ? 'با افزودن' : 'پس از کسر'} {formatDecimalPercentLabel(settings.payoutHoldRate ?? 0.10)} کمسیون نهایی + اقلام اضافی
                    </p>
                </div>

                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-600" />
                            کارانه کلی و کارانه هر بخش
                        </span>
                    </div>
                    <div className="font-mono tabular-nums font-black text-xl text-amber-700 dark:text-amber-300">
                        {Math.round(summary.karaneh.perSectionKaraneh / divisor).toLocaleString('fa-IR')}
                        <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel} / بخش</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                        کارانه کلی آزاد: {Math.round(summary.karaneh.totalAzadFinalCommission / divisor).toLocaleString('fa-IR')} ÷ {summary.karaneh.sectionCount} بخش
                    </p>
                </div>

                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">تفکیک قطعی ۵ بخش</span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono tabular-nums">
                        <div className="flex justify-between"><span className="text-slate-500 font-sans">انبار / آزاد:</span><span className="font-bold">{Math.round(summary.totals.anbar / divisor).toLocaleString('fa-IR')} / {Math.round(summary.totals.azad / divisor).toLocaleString('fa-IR')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-sans">حواله / ثبت‌نام:</span><span className="font-bold">{Math.round(summary.totals.havaleh / divisor).toLocaleString('fa-IR')} / {Math.round(summary.totals.registration / divisor).toLocaleString('fa-IR')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-sans">لیزینگ قطعی:</span><span className="font-bold">{Math.round(summary.totals.leasing / divisor).toLocaleString('fa-IR')}</span></div>
                    </div>
                </div>
            </div>

            {/* Sub-Navigation & Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setSubTab('NAHAYI')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                subTab === 'NAHAYI'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            شیت «نهایی» و رتبه‌بندی
                        </button>
                        <button
                            onClick={() => setSubTab('PAYOUT')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                subTab === 'PAYOUT'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <Wallet className="w-4 h-4" />
                            شیت «پرداختی ماهانه» (−۱۰٪)
                        </button>
                        <button
                            onClick={() => setSubTab('KARANEH')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                subTab === 'KARANEH'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <Gift className="w-4 h-4" />
                            کارانه کلی و جدول سهام کارانه
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" />
                            خروجی XLSX (نهایی + پرداختی + کارانه)
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                        >
                            <Printer className="w-4 h-4" />
                            چاپ
                        </button>
                    </div>
                </div>

                {/* SUB-TAB 1: شیت نهایی */}
                {subTab === 'NAHAYI' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-3.5 px-3 text-center">رتبه</th>
                                    <th className="py-3.5 px-4">نام پرسنل</th>
                                    <th className="py-3.5 px-3">فروش انبار</th>
                                    <th className="py-3.5 px-3">فروش آزاد</th>
                                    <th className="py-3.5 px-3">فروش حواله</th>
                                    <th className="py-3.5 px-3">ثبت‌نام</th>
                                    <th className="py-3.5 px-3">لیزینگ</th>
                                    <th className="py-3.5 px-3">جمع پورسانت</th>
                                    <th className="py-3.5 px-3">مجموع تعدیل‌ها</th>
                                    <th className="py-3.5 px-4 font-black">نهایی ({unitLabel})</th>
                                    <th className="py-3.5 px-3 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {summary.finalRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="py-10 text-center text-slate-400">
                                            داده‌ای برای تجمیع شیت نهایی در این دوره ثبت نشده است.
                                        </td>
                                    </tr>
                                ) : summary.finalRows.map(person => (
                                    <tr key={person.staffName} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-3 text-center font-mono tabular-nums font-black text-slate-500">
                                            #{person.rank}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm">{person.staffName}</div>
                                            {person.draftLeasingCount > 0 && (
                                                <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
                                                    +{person.draftLeasingCount} فقره لیزینگ پیش‌نویس (حذف‌شده از جمع قطعی)
                                                </div>
                                            )}
                                            {person.flaggedExcludedCount > 0 && (
                                                <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                                                    {person.flaggedExcludedCount} ردیف نرخ غیرواقعی در انتظار تأیید مدیر
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 font-mono tabular-nums">{person.anbarCommission > 0 ? Math.round(person.anbarCommission / divisor).toLocaleString('fa-IR') : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums">{person.azadCommission > 0 ? Math.round(person.azadCommission / divisor).toLocaleString('fa-IR') : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums">{person.havalehCommission > 0 ? Math.round(person.havalehCommission / divisor).toLocaleString('fa-IR') : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums">{person.registrationCommission > 0 ? Math.round(person.registrationCommission / divisor).toLocaleString('fa-IR') : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums">{person.leasingCommission > 0 ? Math.round(person.leasingCommission / divisor).toLocaleString('fa-IR') : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                            {Math.round(person.totalSheetCommission / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className={`py-3 px-3 font-mono tabular-nums font-bold ${person.netAdjustmentTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {person.netAdjustmentTotal !== 0
                                                ? `${person.netAdjustmentTotal > 0 ? '+' : ''}${Math.round(person.netAdjustmentTotal / divisor).toLocaleString('fa-IR')}`
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 font-mono tabular-nums font-black text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                                            {Math.round(person.finalCommission / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setViewingPayslipStaff(person)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700"
                                                    title="مشاهده فیش"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditAdjustment(person.staffName)}
                                                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    تعدیل
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {summary.finalRows.length > 0 && (
                                <tfoot className="bg-slate-100 dark:bg-slate-900 font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                                    <tr>
                                        <td colSpan={2} className="py-3.5 px-4 text-left">جمع کل:</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.anbar / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.azad / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.havaleh / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.registration / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.leasing / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.totalSheetCommission / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.totalAdjustments / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3.5 px-4 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {Math.round(summary.totals.totalFinalCommission / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}

                {/* SUB-TAB 2: شیت پرداختی ماهانه */}
                {subTab === 'PAYOUT' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-3.5 px-3 text-center">رتبه</th>
                                    <th className="py-3.5 px-4">نام پرسنل</th>
                                    <th className="py-3.5 px-3">کمسیون نهایی</th>
                                    <th className="py-3.5 px-3">هدیه</th>
                                    <th className="py-3.5 px-3">کمسیون T9</th>
                                    <th className="py-3.5 px-3">مراسم</th>
                                    <th className="py-3.5 px-3">آپشن</th>
                                    <th className="py-3.5 px-3">ثبت‌نام معوقه</th>
                                    <th className="py-3.5 px-3">
                                        {settings.payoutHoldMode === 'ADD' ? `+` : `−`} {formatDecimalPercentLabel(settings.payoutHoldRate ?? 0.10)} نهایی
                                    </th>
                                    <th className="py-3.5 px-4 font-black">نهایی پرداختی ({unitLabel})</th>
                                    <th className="py-3.5 px-3 text-center">اقلام پرداختی</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {summary.payoutRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="py-10 text-center text-slate-400">
                                            داده‌ای برای شیت پرداختی ماهانه یافت نشد.
                                        </td>
                                    </tr>
                                ) : summary.payoutRows.map(p => (
                                    <tr key={p.staffName} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="py-3 px-3 text-center font-mono tabular-nums font-black text-slate-500">#{p.rank}</td>
                                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{p.staffName}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums font-bold">{Math.round(p.finalCommissionFromNahayi / divisor).toLocaleString('fa-IR')}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">{p.gift > 0 ? `+${Math.round(p.gift / divisor).toLocaleString('fa-IR')}` : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">{p.t9Backlog > 0 ? `+${Math.round(p.t9Backlog / divisor).toLocaleString('fa-IR')}` : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">{p.ceremony > 0 ? `+${Math.round(p.ceremony / divisor).toLocaleString('fa-IR')}` : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">{p.optionCommission > 0 ? `+${Math.round(p.optionCommission / divisor).toLocaleString('fa-IR')}` : '-'}</td>
                                        <td className="py-3 px-3 font-mono tabular-nums text-emerald-600">{p.lateRegistration > 0 ? `+${Math.round(p.lateRegistration / divisor).toLocaleString('fa-IR')}` : '-'}</td>
                                        <td className={`py-3 px-3 font-mono tabular-nums font-bold ${p.holdMode === 'ADD' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {p.holdMode === 'ADD' ? '+' : '-'}{Math.round(p.tenPercentHold / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3 px-4 font-mono tabular-nums font-black text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20">
                                            {Math.round(p.finalPayable / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <button
                                                onClick={() => handleOpenEditPayoutExtras(p.staffName)}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 mx-auto"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                                اقلام
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {summary.payoutRows.length > 0 && (
                                <tfoot className="bg-slate-100 dark:bg-slate-900 font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                                    <tr>
                                        <td colSpan={2} className="py-3.5 px-4 text-left">جمع کل پرداختی:</td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums">{Math.round(summary.totals.totalFinalCommission / divisor).toLocaleString('fa-IR')}</td>
                                        <td colSpan={5} className="py-3.5 px-3 font-mono tabular-nums text-emerald-600 text-center">
                                            جمع اضافات: +{Math.round(summary.totals.totalExtras / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3.5 px-3 font-mono tabular-nums text-rose-600">
                                            {settings.payoutHoldMode === 'ADD' ? '+' : '-'}{Math.round(summary.totals.totalTenPercentHold / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
                                            {Math.round(summary.totals.totalFinalPayable / divisor).toLocaleString('fa-IR')}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}

                {/* SUB-TAB 3: کارانه کلی، کارانه هر بخش و جدول سهام کارانه */}
                {subTab === 'KARANEH' && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block mb-1">کارانه کلی (جمع نهایی پورسانت‌های آزاد)</span>
                                <span className="font-mono tabular-nums font-black text-xl text-amber-900 dark:text-amber-100">
                                    {Math.round(summary.karaneh.totalAzadFinalCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                </span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">تعداد بخش‌های تقسیم</span>
                                <span className="font-mono tabular-nums font-black text-xl text-slate-800 dark:text-white">
                                    {summary.karaneh.sectionCount.toLocaleString('fa-IR')} بخش
                                </span>
                            </div>
                            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block mb-1">کارانه هر بخش (کارانه کلی ÷ تعداد بخش)</span>
                                <span className="font-mono tabular-nums font-black text-xl text-emerald-700 dark:text-emerald-300">
                                    {Math.round(summary.karaneh.perSectionKaraneh / divisor).toLocaleString('fa-IR')} {unitLabel}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-xs text-right border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="py-3 px-4 text-center w-14">ردیف</th>
                                        <th className="py-3 px-4">دریافت‌کننده سهم کارانه</th>
                                        <th className="py-3 px-4">روش محاسبه</th>
                                        <th className="py-3 px-4">درصد / مقدار ثابت</th>
                                        <th className="py-3 px-4 font-black">سهم محاسبه‌شده ({unitLabel})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {summary.karaneh.recipientShares.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{s.recipientName}</td>
                                            <td className="py-3 px-4 text-slate-500">{s.mode === 'FIXED' ? 'مبلغ ثابت' : 'درصد از کارانه هر بخش'}</td>
                                            <td className="py-3 px-4 font-mono tabular-nums font-bold">
                                                {s.mode === 'FIXED'
                                                    ? `${Math.round(s.fixedAmount / divisor).toLocaleString('fa-IR')} ${unitLabel}`
                                                    : formatDecimalPercentLabel(s.percent)}
                                            </td>
                                            <td className="py-3 px-4 font-mono tabular-nums font-black text-amber-700 dark:text-amber-300">
                                                {Math.round(s.calculatedAmount / divisor).toLocaleString('fa-IR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-100 dark:bg-slate-900 font-black border-t border-slate-300 dark:border-slate-600">
                                    <tr>
                                        <td colSpan={4} className="py-3 px-4 text-left">جمع کل سهام کارانه:</td>
                                        <td className="py-3 px-4 font-mono tabular-nums text-amber-700 dark:text-amber-300">
                                            {Math.round(summary.karaneh.totalDistributedShares / divisor).toLocaleString('fa-IR')} {unitLabel}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Individual Payslip Modal */}
            {viewingPayslipStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl p-6 relative">
                        <button
                            onClick={() => setViewingPayslipStaff(null)}
                            className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                                <Building className="w-3.5 h-3.5" />
                                گروه خودرویی حسینی • فیش پورسانت (رتبه #{viewingPayslipStaff.rank})
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{viewingPayslipStaff.staffName}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">دوره مالی: {activePeriodName}</p>
                        </div>

                        <div className="py-4 space-y-2.5 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between">
                                    <span className="text-slate-500">فروش انبار:</span>
                                    <span className="font-mono tabular-nums font-bold">{Math.round(viewingPayslipStaff.anbarCommission / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between">
                                    <span className="text-slate-500">فروش آزاد:</span>
                                    <span className="font-mono tabular-nums font-bold">{Math.round(viewingPayslipStaff.azadCommission / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between">
                                    <span className="text-slate-500">فروش حواله:</span>
                                    <span className="font-mono tabular-nums font-bold">{Math.round(viewingPayslipStaff.havalehCommission / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between">
                                    <span className="text-slate-500">ثبت‌نام و لیزینگ:</span>
                                    <span className="font-mono tabular-nums font-bold">{Math.round((viewingPayslipStaff.registrationCommission + viewingPayslipStaff.leasingCommission) / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between">
                                <span className="text-slate-500">تعدیلات (هدیه، مراسم، پاداش، کسورات):</span>
                                <span className="font-mono tabular-nums font-bold">
                                    {viewingPayslipStaff.netAdjustmentTotal >= 0 ? '+' : ''}
                                    {Math.round(viewingPayslipStaff.netAdjustmentTotal / divisor).toLocaleString('fa-IR')} {unitLabel}
                                </span>
                            </div>

                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex justify-between items-center">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300">خالص نهایی در شیت «نهایی»:</span>
                                <span className="font-mono tabular-nums font-black text-lg text-emerald-700 dark:text-emerald-300">
                                    {Math.round(viewingPayslipStaff.finalCommission / divisor).toLocaleString('fa-IR')} {unitLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button type="button" onClick={() => setViewingPayslipStaff(null)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl">بستن</button>
                            <button type="button" onClick={() => window.print()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                                <Printer className="w-4 h-4" /> چاپ فیش
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Editing Nahayi Adjustments */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">تعدیلات شیت «نهایی»</h3>
                        <p className="text-xs text-emerald-600 font-bold mb-4">پرسنل: {editingStaff} ({activePeriodName})</p>

                        <form onSubmit={handleSaveAdjustment} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">هدیه ({unitLabel})</label>
                                    <input type="number" value={editGift} onChange={e => setEditGift(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مراسم ({unitLabel})</label>
                                    <input type="number" value={editCeremony} onChange={e => setEditCeremony(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">پاداش ({unitLabel})</label>
                                    <input type="number" value={editBonus} onChange={e => setEditBonus(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-emerald-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کسورات ({unitLabel})</label>
                                    <input type="number" value={editDeductions} onChange={e => setEditDeductions(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-rose-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="علت یا یادداشت" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs" />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">انصراف</button>
                                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">ثبت و ذخیره</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Editing Payout Sheet Extras */}
            {editingPayoutStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">اقلام شیت «پرداختی ماهانه»</h3>
                        <p className="text-xs text-indigo-600 font-bold mb-4">پرسنل: {editingPayoutStaff} ({activePeriodName})</p>

                        <form onSubmit={handleSavePayoutExtras} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">هدیه ({unitLabel})</label>
                                    <input type="number" value={poGift} onChange={e => setPoGift(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کمسیون T9 معوقه ({unitLabel})</label>
                                    <input type="number" value={poT9Backlog} onChange={e => setPoT9Backlog(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مراسم ({unitLabel})</label>
                                    <input type="number" value={poCeremony} onChange={e => setPoCeremony(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">آپشن ({unitLabel})</label>
                                    <input type="number" value={poOption} onChange={e => setPoOption(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ثبت‌نام معوقه ({unitLabel})</label>
                                    <input type="number" value={poLateReg} onChange={e => setPoLateReg(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سایر ({unitLabel})</label>
                                    <input type="number" value={poOther} onChange={e => setPoOther(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات پرداختی</label>
                                <input type="text" value={poNotes} onChange={e => setPoNotes(e.target.value)} placeholder="یادداشت پرداختی" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs" />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => setEditingPayoutStaff(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">انصراف</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">ذخیره اقلام پرداختی</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
