import React, { useState, useEffect } from 'react';
import { CommissionSettings, CommissionCategory, KaranehShareConfig } from '../../types';
import {
    DEFAULT_COMMISSION_SETTINGS,
    DEFAULT_KARANEH_SHARES,
    calculateDealFinancials,
    decimalToPercentNumber,
    percentNumberToDecimal,
    formatDecimalPercentLabel
} from '../../services/commissionService';
import {
    X,
    Sliders,
    RotateCcw,
    Calculator,
    Info,
    Save,
    CheckCircle2,
    ShieldAlert,
    Plus,
    Trash2,
    AlertTriangle,
    Users
} from 'lucide-react';

interface CommissionSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: CommissionSettings;
    onSaveSettings: (settings: CommissionSettings) => void;
}

export const CommissionSettingsModal: React.FC<CommissionSettingsModalProps> = ({
    isOpen,
    onClose,
    currentSettings,
    onSaveSettings
}) => {
    const [settings, setSettings] = useState<CommissionSettings>(currentSettings);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Live Simulator states
    const [testCategory, setTestCategory] = useState<CommissionCategory>('ANBAR');
    const [testSalePrice, setTestSalePrice] = useState<number>(34500000000);
    const [testPurchasePrice, setTestPurchasePrice] = useState<number>(31000000000);
    const [testDailyPrice, setTestDailyPrice] = useState<number>(34000000000);
    const [testDownPayment, setTestDownPayment] = useState<number>(15000000000);
    const [testPartners, setTestPartners] = useState<number>(1);
    const [testHardDeal, setTestHardDeal] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            setSettings({
                ...DEFAULT_COMMISSION_SETTINGS,
                ...currentSettings,
                karanehShares: currentSettings.karanehShares && currentSettings.karanehShares.length > 0
                    ? currentSettings.karanehShares
                    : DEFAULT_KARANEH_SHARES
            });
            setSavedSuccess(false);
        }
    }, [isOpen, currentSettings]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSettings({
            ...settings,
            settingsVersion: 2
        });
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 700);
    };

    const handleReset = () => {
        if (window.confirm('آیا از بازنشانی پارامترها به مقادیر مصوب پیش‌فرض اطمینان دارید؟')) {
            setSettings({ ...DEFAULT_COMMISSION_SETTINGS });
        }
    };

    const karanehShares = settings.karanehShares || DEFAULT_KARANEH_SHARES;

    const handleUpdateKaranehShare = (id: string, patch: Partial<KaranehShareConfig>) => {
        const updated = karanehShares.map(item => item.id === id ? { ...item, ...patch } : item);
        setSettings({ ...settings, karanehShares: updated });
    };

    const handleAddKaranehShare = () => {
        const newItem: KaranehShareConfig = {
            id: `kr-${Date.now()}`,
            recipientName: 'دریافت‌کننده جدید',
            mode: 'PERCENT',
            percent: 0.10,
            fixedAmount: 0
        };
        setSettings({ ...settings, karanehShares: [...karanehShares, newItem] });
    };

    const handleDeleteKaranehShare = (id: string) => {
        setSettings({ ...settings, karanehShares: karanehShares.filter(s => s.id !== id) });
    };

    const simResult = calculateDealFinancials(
        testCategory,
        {
            salePrice: testSalePrice,
            purchasePrice: testPurchasePrice,
            dailyPrice: testDailyPrice,
            downPayment: testDownPayment,
            participantCount: testPartners,
            isHardDeal: testHardDeal
        },
        settings
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto shadow-2xl">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                پارامترهای سیستمی، فرمول‌ها و جدول سهام کارانه
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                تنظیم نرخ‌های اعشاری پورسانت، پورسانت تشویقی انبار، نرخ لیزینگ، کسر ۱۰٪ پرداختی و سهام کارانه
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
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            تمامی درصدها در پایگاه‌داده به‌صورت اعشار استاندارد (مثلاً <span className="font-mono font-bold">0.05</span> برای ۵٪) ذخیره می‌شوند تا در محاسبات مستقیم و گزارش‌های اکسل کاملاً دقیق باشند. همچنین مقدار <span className="font-mono font-bold">MAX(0, ...)</span> از منفی شدن پورسانت پایه جلوگیری می‌کند.
                        </div>
                    </div>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. Anbar */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white">
                                    شیت «انبار» (ANBAR)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    پیش‌فرض: ۵٪ + ۵۰م ریال
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                فرمول: MAX(0, فروش - قیمت روز) × نرخ انبار + پورسانت تشویقی
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نرخ پورسانت (٪)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={decimalToPercentNumber(settings.anbarRate)}
                                            onChange={e => setSettings({ ...settings, anbarRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                            required
                                        />
                                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">پورسانت تشویقی (ریال)</label>
                                    <input
                                        type="number"
                                        step="1000000"
                                        min="0"
                                        value={settings.anbarIncentiveBonus ?? 50000000}
                                        onChange={e => setSettings({ ...settings, anbarIncentiveBonus: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Azad */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white">
                                    شیت «آزاد» (AZAD)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                                    پیش‌فرض: ۱۰٪ عادی / ۱۵٪ سخت
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                فرمول: MAX(0, فروش - خرید) × نرخ ÷ تعداد پرسنل مشارکت‌کننده
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نرخ عادی سود (٪)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={decimalToPercentNumber(settings.azadRate)}
                                            onChange={e => setSettings({ ...settings, azadRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نرخ «معاملات سخت» (٪)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={decimalToPercentNumber(settings.azadHardRate)}
                                            onChange={e => setSettings({ ...settings, azadHardRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Havaleh */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white">
                                    شیت «حواله» (HAVALEH)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                    پیش‌فرض: ۱۰٪
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                فرمول: MAX(0, فروش - قیمت روز) × نرخ حواله ÷ تعداد پرسنل (سبد بعدی صرفاً اطلاعاتی است)
                            </p>
                            <div className="relative w-1/2">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={decimalToPercentNumber(settings.havalehRate)}
                                    onChange={e => setSettings({ ...settings, havalehRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 4. Registration */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white">
                                    شیت «ثبت نام» (REGISTRATION)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                    پیش‌فرض: ۹٪
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                فرمول: پیش‌پرداخت × ۹٪ (ستون I شیت ثبت‌نام)
                            </p>
                            <div className="relative w-1/2">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={decimalToPercentNumber(settings.registrationRate)}
                                    onChange={e => setSettings({ ...settings, registrationRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                                    required
                                />
                                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 5. Leasing (Draft / Manager Confirmed) */}
                        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-purple-900 dark:text-purple-200">
                                    شیت «لیزینگ» (LEASING)
                                </label>
                                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                    {settings.leasingRateConfirmed ? `تأییدشده (${formatDecimalPercentLabel(settings.leasingRate)})` : 'نامشخص (حالت پیش‌نویس)'}
                                </span>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={Boolean(settings.leasingRateConfirmed)}
                                    onChange={e => {
                                        const confirmed = e.target.checked;
                                        setSettings({
                                            ...settings,
                                            leasingRateConfirmed: confirmed,
                                            leasingRate: confirmed ? (settings.leasingRate ?? 0.01) : null
                                        });
                                    }}
                                    className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                                />
                                تایید و اعمال نرخ لیزینگ در جمع قطعی دوره
                            </label>
                            {settings.leasingRateConfirmed ? (
                                <div className="relative w-1/2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={decimalToPercentNumber(settings.leasingRate ?? 0)}
                                        onChange={e => setSettings({ ...settings, leasingRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    تا زمانی که نرخ لیزینگ تعیین و تایید نشود، ردیف‌های لیزینگ به‌صورت «پیش‌نویس» ثبت شده و در جمع قطعی «نهایی» منظور نمی‌شوند.
                                </div>
                            )}
                        </div>

                        {/* 6. Payout Hold Rate (10%) */}
                        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                                    سهم ۱۰٪ کمسیون نهایی (شیت پرداختی)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300">
                                    پیش‌فرض: ۱۰٪ کسر
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نرخ ذخیره/کسر (٪)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="100"
                                            value={decimalToPercentNumber(settings.payoutHoldRate ?? 0.10)}
                                            onChange={e => setSettings({ ...settings, payoutHoldRate: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:ring-2 focus:ring-rose-500"
                                        />
                                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">٪</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نحوه اعمال در پرداختی</label>
                                    <select
                                        value={settings.payoutHoldMode || 'DEDUCT'}
                                        onChange={e => setSettings({ ...settings, payoutHoldMode: e.target.value as 'DEDUCT' | 'ADD' })}
                                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold outline-none"
                                    >
                                        <option value="DEDUCT">کسر از پرداختی (−)</option>
                                        <option value="ADD">افزودن به پرداختی (+)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 7. Karaneh Section Count & Recipient Shares Table */}
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-amber-600" />
                                    پیکربندی کارانه کلی، کارانه هر بخش و جدول سهام کارانه
                                </h4>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                                    کارانه کلی = جمع نهایی پورسانت‌های بخش آزاد | کارانه هر بخش = کارانه کلی ÷ تعداد بخش‌ها
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تعداد بخش‌ها:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={settings.karanehSectionCount ?? 4}
                                    onChange={e => setSettings({ ...settings, karanehSectionCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                    className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono tabular-nums font-bold text-center outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddKaranehShare}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    افزودن ردیف
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white dark:bg-slate-900/60 rounded-xl border border-amber-200/70 dark:border-amber-800/40">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-amber-100/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
                                    <tr>
                                        <th className="px-3 py-2 font-black">نام دریافت‌کننده</th>
                                        <th className="px-3 py-2 font-black">نوع سهم</th>
                                        <th className="px-3 py-2 font-black">مقدار (درصد یا ریال)</th>
                                        <th className="px-3 py-2 font-black w-12 text-center">حذف</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {karanehShares.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.recipientName}
                                                    onChange={e => handleUpdateKaranehShare(item.id, { recipientName: e.target.value })}
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={item.mode}
                                                    onChange={e => handleUpdateKaranehShare(item.id, { mode: e.target.value as 'PERCENT' | 'FIXED' })}
                                                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                                >
                                                    <option value="PERCENT">درصدی از کارانه هر بخش</option>
                                                    <option value="FIXED">مبلغ ثابت (ریال)</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.mode === 'PERCENT' ? (
                                                    <div className="relative w-32">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="100"
                                                            value={decimalToPercentNumber(item.percent ?? 0)}
                                                            onChange={e => handleUpdateKaranehShare(item.id, { percent: percentNumberToDecimal(parseFloat(e.target.value) || 0) })}
                                                            className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none"
                                                        />
                                                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">٪</span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        step="500000"
                                                        min="0"
                                                        value={item.fixedAmount ?? 0}
                                                        onChange={e => handleUpdateKaranehShare(item.id, { fixedAmount: parseFloat(e.target.value) || 0 })}
                                                        className="w-40 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold outline-none"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteKaranehShare(item.id)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Live Test Simulator */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-emerald-600" />
                                شبیه‌ساز زنده فرمول‌های محاسباتی:
                            </span>
                            {testCategory === 'AZAD' && (
                                <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={testHardDeal}
                                        onChange={e => setTestHardDeal(e.target.checked)}
                                        className="rounded border-amber-400 text-amber-600"
                                    />
                                    معامله سخت ({formatDecimalPercentLabel(settings.azadHardRate)})
                                </label>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">شیت:</span>
                                <select
                                    value={testCategory}
                                    onChange={e => setTestCategory(e.target.value as CommissionCategory)}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                >
                                    <option value="ANBAR">انبار</option>
                                    <option value="AZAD">آزاد</option>
                                    <option value="HAVALEH">حواله</option>
                                    <option value="REGISTRATION">ثبت‌نام</option>
                                    <option value="LEASING">لیزینگ</option>
                                </select>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">نرخ خرید (ریال):</span>
                                <input
                                    type="number"
                                    value={testPurchasePrice}
                                    onChange={e => setTestPurchasePrice(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">قیمت روز (ریال):</span>
                                <input
                                    type="number"
                                    value={testDailyPrice}
                                    onChange={e => setTestDailyPrice(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">نرخ فروش (ریال):</span>
                                <input
                                    type="number"
                                    value={testSalePrice}
                                    onChange={e => setTestSalePrice(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">پیش‌پرداخت (ریال):</span>
                                <input
                                    type="number"
                                    value={testDownPayment}
                                    onChange={e => setTestDownPayment(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">تعداد پرسنل:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={testPartners}
                                    onChange={e => setTestPartners(Math.max(1, Number(e.target.value) || 1))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                                />
                            </div>
                        </div>

                        {/* Result Output */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs">
                            <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">نرخ / وضعیت:</span>
                                <span className="font-bold text-slate-800 dark:text-white font-mono">
                                    {simResult.isDraftLeasing ? 'پیش‌نویس (نامشخص)' : formatDecimalPercentLabel(simResult.effectiveRate)}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                                    {testCategory === 'ANBAR' ? 'پورسانت قدیم + تشویقی:' : 'سود / مابه‌التفاوت:'}
                                </span>
                                <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                    {testCategory === 'ANBAR'
                                        ? `${simResult.oldCommissionAmount.toLocaleString('fa-IR')} + ${simResult.incentiveBonusAmount.toLocaleString('fa-IR')}`
                                        : `${simResult.grossProfit.toLocaleString('fa-IR')} ریال`}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">پورسانت کل معامله:</span>
                                <span className="font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300">
                                    {simResult.commissionAmount.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">سهم هر نفر (۱۰٪: {simResult.tenPercentCommission.toLocaleString('fa-IR')}):</span>
                                <span className="font-mono tabular-nums font-black text-indigo-700 dark:text-indigo-300">
                                    {simResult.perPersonCommission.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            بازنشانی به مقادیر مصوب
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                            >
                                {savedSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        ذخیره شد!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        ذخیره پارامترها
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>

            </div>
        </div>
    );
};
