import React, { useState, useEffect } from 'react';
import { CommissionSettings, CommissionCategory } from '../../types';
import { DEFAULT_COMMISSION_SETTINGS, calculateCommissionForCategory } from '../../services/commissionService';
import { 
    X, 
    Sliders, 
    Check, 
    RotateCcw, 
    Calculator, 
    AlertCircle, 
    Info, 
    Percent, 
    Save, 
    Layers, 
    CheckCircle2,
    Building2,
    ShieldAlert
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
    const [testSalePrice, setTestSalePrice] = useState<number>(24000000000); // 2.4 میلیارد تومان
    const [testPurchasePrice, setTestPurchasePrice] = useState<number>(20000000000);
    const [testDailyPrice, setTestDailyPrice] = useState<number>(24500000000); // زیان روز ۵۰ میلیون تومان
    const [testDownPayment, setTestDownPayment] = useState<number>(15000000000);

    useEffect(() => {
        if (isOpen) {
            setSettings(currentSettings);
            setSavedSuccess(false);
        }
    }, [isOpen, currentSettings]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSettings(settings);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 800);
    };

    const handleReset = () => {
        if (window.confirm('آیا از بازنشانی درصد‌های پورسانت به مقادیر پیش‌فرض سیستم اطمینان دارید؟')) {
            setSettings(DEFAULT_COMMISSION_SETTINGS);
        }
    };

    // Run simulation using current in-modal settings
    const simResult = calculateCommissionForCategory(testCategory, {
        salePrice: testSalePrice,
        purchasePrice: testPurchasePrice,
        dailyPrice: testDailyPrice,
        downPayment: testDownPayment,
    }, settings);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-l from-indigo-500/10 via-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                تنظیمات درصدها و فرمول‌های محاسبه پورسانت
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                تغییر ضرایب و نرخ‌های درصدی محاسبات پورسانت برای کلیه دسته‌بندی‌های معاملات
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
                    
                    {/* Notice */}
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-black block mb-0.5">راهنمای اعمال تغییرات درصدها:</span>
                            درصدهای تنظیم‌شده در این بخش به صورت زنده در تمامی ثبت‌های جدید و محاسبات سیستم لحاظ می‌شوند. همچنین برای هر معامله امکان تغییر دستی مجزا نیز فراهم است.
                        </div>
                    </div>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. Anbar Rate */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    فروش انبار (ANBAR)
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">پیش‌فرض: ۰.۰۵٪</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                درصد محاسبه پورسانت از کل مبلغ نرخ فروش خودرو
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="100"
                                    value={settings.anbarRate}
                                    onChange={e => setSettings({ ...settings, anbarRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 2. Azad Rate (Profit & Flat) */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    فروش آزاد (AZAD)
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">پیش‌فرض: ۱۰٪ سود</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                درصد سهم از سود کل کمیسیون معامله (فروش منهای خرید)
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={settings.azadRate}
                                    onChange={e => setSettings({ ...settings, azadRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block mb-1">درصد کف فروش آزاد (در صورت عدم سود):</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        max="100"
                                        value={settings.azadFlatRate}
                                        onChange={e => setSettings({ ...settings, azadFlatRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                                    />
                                    <span className="absolute left-3 top-1.5 text-xs font-bold text-slate-400">٪</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Havaleh Rate */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    فروش حواله (HAVALEH)
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">پیش‌فرض: ۰.۰۵٪</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                درصد محاسبه پورسانت از مبلغ کل فروش حواله
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="100"
                                    value={settings.havalehRate}
                                    onChange={e => setSettings({ ...settings, havalehRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 4. Leasing Rate */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    لیزینگ و اقساط (LEASING)
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">پیش‌فرض: ۰.۱٪</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                درصد محاسبه پورسانت از مبلغ پیش‌پرداخت پرونده
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={settings.leasingRate}
                                    onChange={e => setSettings({ ...settings, leasingRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 5. Registration Rate */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    ثبت‌نام کارخانه (REGISTRATION)
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">پیش‌فرض: ۰.۱٪</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                درصد پورسانت از پیش‌پرداخت ثبت‌نام نمایندگی
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={settings.registrationRate}
                                    onChange={e => setSettings({ ...settings, registrationRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                            </div>
                        </div>

                        {/* 6. Loss Penalty Rate (Rule for negative profit/loss) */}
                        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                                    ضریب جریمه زیان روز (قانون سود/زیان منفی)
                                </label>
                                <span className="text-[10px] text-rose-600 font-mono font-bold">پیش‌فرض: ۰.۲۵٪</span>
                            </div>
                            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                                هنگامی که نرخ فروش کمتر از قیمت روز باشد (زیان روز)، پورسانت بر مبنای این درصد از نرخ فروش محاسبه می‌شود.
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={settings.lossPenaltyRate}
                                    onChange={e => setSettings({ ...settings, lossPenaltyRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-mono font-black text-rose-700 dark:text-rose-300 focus:ring-2 focus:ring-rose-500 outline-none"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-xs font-bold text-rose-500">٪</span>
                            </div>
                        </div>

                    </div>

                    {/* Live Test Simulator */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-emerald-600" />
                                شبیه‌ساز زنده محاسبه با درصدهای فوق:
                            </span>
                            <span className="text-[10px] text-slate-400">تست آزمایشی فرمول</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">نوع شیت:</span>
                                <select 
                                    value={testCategory}
                                    onChange={e => setTestCategory(e.target.value as CommissionCategory)}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                                >
                                    <option value="ANBAR">فروش انبار</option>
                                    <option value="AZAD">فروش آزاد</option>
                                    <option value="HAVALEH">فروش حواله</option>
                                    <option value="LEASING">لیزینگ</option>
                                    <option value="REGISTRATION">ثبت‌نام</option>
                                </select>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">نرخ فروش (ریال):</span>
                                <input
                                    type="number"
                                    value={testSalePrice}
                                    onChange={e => setTestSalePrice(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">قیمت روز (ریال):</span>
                                <input
                                    type="number"
                                    value={testDailyPrice}
                                    onChange={e => setTestDailyPrice(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block mb-1">پیش‌پرداخت (ریال):</span>
                                <input
                                    type="number"
                                    value={testDownPayment}
                                    onChange={e => setTestDownPayment(Number(e.target.value))}
                                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                                />
                            </div>
                        </div>

                        {/* Result Output */}
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                                    {simResult.isLossPenalty ? 'وضعیت زیان روز (فرمول جریمه فعال شد):' : 'درصد اعمال شده:'}
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {simResult.effectiveRate}٪ {simResult.isLossPenalty && '⚠️ (ضریب زیان روز)'}
                                </span>
                            </div>
                            <div className="text-left">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">پورسانت محاسبه‌شده خروجی:</span>
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                    {simResult.commissionAmount.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            بازنشانی به پیش‌فرض
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
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                            >
                                {savedSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        ذخیره شد!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        ذخیره تغییرات درصدها
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
