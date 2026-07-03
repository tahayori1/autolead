
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon } from '../components/icons/CalculatorIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';

// --- Types ---
interface KPI {
    id: string;
    label: string;
    weight: number; // Percentage (e.g., 30 for 30%)
    score: number; // 0-100
}

interface AttendanceZone {
    name: string;
    label: string;
    color: string;
    bgColor: string;
    factor: number;
    range: [number, number]; // [min, max] minutes
}

const CommissionPage: React.FC = () => {
    // --- State ---
    // 1. Raw Commission by Sale Type
    const [havalehProfit, setHavalehProfit] = useState<number | ''>('');
    const [havalehRate, setHavalehRate] = useState<number | ''>(3);

    const [leasingCount, setLeasingCount] = useState<number | ''>('');
    const [leasingRate, setLeasingRate] = useState<number | ''>(200000);

    const [usedProfit, setUsedProfit] = useState<number | ''>('');
    const [usedRate, setUsedRate] = useState<number | ''>(10);

    const [factoryCount, setFactoryCount] = useState<number | ''>('');
    const [factoryRate, setFactoryRate] = useState<number | ''>(50000);

    // 2. Sales Volume Targets (New Section)
    const [leasingTarget, setLeasingTarget] = useState<number | ''>(5);
    const [leasingActual, setLeasingActual] = useState<number | ''>('');
    
    const [factoryTarget, setFactoryTarget] = useState<number | ''>(10);
    const [factoryActual, setFactoryActual] = useState<number | ''>('');

    const [usedTarget, setUsedTarget] = useState<number | ''>(3);
    const [usedActual, setUsedActual] = useState<number | ''>('');

    const [havalehTarget, setHavalehTarget] = useState<number | ''>(5);
    const [havalehActual, setHavalehActual] = useState<number | ''>('');

    // 3. Quality KPIs
    const [kpis, setKpis] = useState<KPI[]>([
        { id: 'acquisition', label: 'جذب مشتری جدید', weight: 30, score: 90 },
        { id: 'reporting', label: 'گزارش‌دهی و پیگیری', weight: 20, score: 100 },
        { id: 'teamwork', label: 'روحیه کار تیمی', weight: 30, score: 80 },
        { id: 'csat', label: 'رضایت مشتری (CSAT)', weight: 20, score: 95 },
    ]);

    // 4. Attendance
    const [delayMinutes, setDelayMinutes] = useState<number | ''>(0);

    // --- Logic ---

    // Zone Definitions
    const ZONES: AttendanceZone[] = [
        { name: 'green', label: 'ناحیه سبز (عالی)', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', factor: 1.0, range: [0, 60] },
        { name: 'yellow1', label: 'ناحیه زرد ۱ (خفیف)', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', factor: 0.9, range: [61, 120] },
        { name: 'yellow2', label: 'ناحیه زرد ۲ (متوسط)', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', factor: 0.7, range: [121, 180] },
        { name: 'red', label: 'ناحیه قرمز (خطر)', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30', factor: 0.0, range: [181, Infinity] },
    ];

    const currentZone = useMemo(() => {
        const delays = Number(delayMinutes) || 0;
        return ZONES.find(z => delays >= z.range[0] && delays <= z.range[1]) || ZONES[3];
    }, [delayMinutes]);

    // Calculations
    const rawCommission = useMemo(() => {
        const havalehComm = (Number(havalehProfit) || 0) * ((Number(havalehRate) || 0) / 100);
        const leasingComm = (Number(leasingCount) || 0) * (Number(leasingRate) || 0);
        const usedComm = (Number(usedProfit) || 0) * ((Number(usedRate) || 0) / 100);
        const factoryComm = (Number(factoryCount) || 0) * (Number(factoryRate) || 0);
        return havalehComm + leasingComm + usedComm + factoryComm;
    }, [havalehProfit, havalehRate, leasingCount, leasingRate, usedProfit, usedRate, factoryCount, factoryRate]);

    const salesPerformanceFactor = useMemo(() => {
        let totalAchievement = 0;
        let activeTargets = 0;

        const calculateAchievement = (actual: number | '', target: number | '') => {
            const t = Number(target);
            const a = Number(actual);
            if (t > 0) {
                activeTargets++;
                // Cap achievement at 120% to reward over-performance slightly but not infinitely, 
                // or keep it at 1.0 max. Let's cap at 1.0 for standard commission logic.
                return Math.min(1, a / t); 
            }
            return 0;
        };

        totalAchievement += calculateAchievement(leasingActual, leasingTarget);
        totalAchievement += calculateAchievement(factoryActual, factoryTarget);
        totalAchievement += calculateAchievement(usedActual, usedTarget);
        totalAchievement += calculateAchievement(havalehActual, havalehTarget);

        if (activeTargets === 0) return 1; // If no targets set, don't penalize
        return totalAchievement / activeTargets;
    }, [leasingActual, leasingTarget, factoryActual, factoryTarget, usedActual, usedTarget, havalehActual, havalehTarget]);

    const qualityScore = useMemo(() => {
        // Sum(Score * Weight) / 100
        const totalWeightedScore = kpis.reduce((acc, kpi) => acc + (kpi.score * kpi.weight), 0);
        return totalWeightedScore / 100; // Returns score out of 100
    }, [kpis]);

    const qualityFactor = qualityScore / 100; // Returns factor 0.0 - 1.0

    const finalCommission = rawCommission * salesPerformanceFactor * qualityFactor * currentZone.factor;

    // Handlers
    const handleKpiChange = (id: string, val: number) => {
        setKpis(prev => prev.map(k => k.id === id ? { ...k, score: Math.min(100, Math.max(0, val)) } : k));
    };

    const SalesTargetRow = ({ label, actual, setActual, target, setTarget }: { label: string, actual: number | '', setActual: (v: number | '') => void, target: number | '', setTarget: (v: number | '') => void }) => {
        const percent = target && Number(target) > 0 ? Math.min(100, Math.round((Number(actual) / Number(target)) * 100)) : 0;
        return (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
                    <span className={`text-xs font-mono font-bold ${percent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{percent}%</span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <label className="absolute -top-3 right-2 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1">تارگت</label>
                        <input 
                            type="number" 
                            value={target} 
                            onChange={e => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-center text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-sky-500"
                            placeholder="0"
                        />
                    </div>
                    <span className="text-slate-400">/</span>
                    <div className="flex-1 relative">
                        <label className="absolute -top-3 right-2 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1">فروش</label>
                        <input 
                            type="number" 
                            value={actual} 
                            onChange={e => setActual(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-center text-sm border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-sky-500 font-bold text-slate-800 dark:text-white"
                            placeholder="0"
                        />
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400">
                    <CalculatorIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">محاسبه پورسانت</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">مدل جامع (عملکرد، کیفیت، انضباط)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Step 1: Raw Commission */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">۱</span>
                            پورسانت پایه بر اساس نوع فروش
                        </h3>

                        <div className="space-y-6">
                            {/* Havaleh */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">فروش حواله</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">مجموع سود (تفاضل قیمت کارخانه و فروش)</label>
                                        <input 
                                            type="number" 
                                            value={havalehProfit} 
                                            onChange={e => setHavalehProfit(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                            placeholder="تومان" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">درصد پورسانت</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={havalehRate} 
                                                onChange={e => setHavalehRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm pl-8"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-left text-sm font-bold text-blue-600 dark:text-blue-400">
                                    پورسانت حواله: {((Number(havalehProfit) || 0) * ((Number(havalehRate) || 0) / 100)).toLocaleString('fa-IR')} تومان
                                </div>
                            </div>

                            {/* Leasing */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">فروش لیزینگی</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">تعداد پرونده‌های لیزینگ</label>
                                        <input 
                                            type="number" 
                                            value={leasingCount} 
                                            onChange={e => setLeasingCount(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                            placeholder="عدد" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">مبلغ پورسانت هر پرونده (تومان)</label>
                                        <input 
                                            type="number" 
                                            value={leasingRate} 
                                            onChange={e => setLeasingRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 text-left text-sm font-bold text-blue-600 dark:text-blue-400">
                                    پورسانت لیزینگ: {((Number(leasingCount) || 0) * (Number(leasingRate) || 0)).toLocaleString('fa-IR')} تومان
                                </div>
                            </div>

                            {/* Used/Zero */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">فروش صفر یا کارکرده (نقدی)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">مجموع کارمزد یا سود فروش</label>
                                        <input 
                                            type="number" 
                                            value={usedProfit} 
                                            onChange={e => setUsedProfit(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                            placeholder="تومان" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">درصد پورسانت</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={usedRate} 
                                                onChange={e => setUsedRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm pl-8"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-left text-sm font-bold text-blue-600 dark:text-blue-400">
                                    پورسانت نقدی: {((Number(usedProfit) || 0) * ((Number(usedRate) || 0) / 100)).toLocaleString('fa-IR')} تومان
                                </div>
                            </div>

                            {/* Factory */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">ثبت نام کارخانه</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">تعداد ثبت نام</label>
                                        <input 
                                            type="number" 
                                            value={factoryCount} 
                                            onChange={e => setFactoryCount(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                            placeholder="عدد" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">مبلغ پورسانت هر ثبت نام (تومان)</label>
                                        <input 
                                            type="number" 
                                            value={factoryRate} 
                                            onChange={e => setFactoryRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 text-left text-sm font-bold text-blue-600 dark:text-blue-400">
                                    پورسانت ثبت نام: {((Number(factoryCount) || 0) * (Number(factoryRate) || 0)).toLocaleString('fa-IR')} تومان
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800">
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-300">مجموع پورسانت پایه (خام):</span>
                            <span className="font-mono font-black text-blue-900 dark:text-blue-200 text-xl">
                                {rawCommission.toLocaleString('fa-IR')} <span className="text-sm font-sans font-normal">تومان</span>
                            </span>
                        </div>
                    </section>

                    {/* Step 2: Sales Volume Targets */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs">۲</span>
                            ضریب عملکرد فروش (تارگت‌ها)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <SalesTargetRow 
                                label="فروش لیزینگی" 
                                actual={leasingActual} 
                                setActual={setLeasingActual} 
                                target={leasingTarget} 
                                setTarget={setLeasingTarget} 
                            />
                            <SalesTargetRow 
                                label="ثبت نام کارخانه" 
                                actual={factoryActual} 
                                setActual={setFactoryActual} 
                                target={factoryTarget} 
                                setTarget={setFactoryTarget} 
                            />
                            <SalesTargetRow 
                                label="فروش دست دوم" 
                                actual={usedActual} 
                                setActual={setUsedActual} 
                                target={usedTarget} 
                                setTarget={setUsedTarget} 
                            />
                            <SalesTargetRow 
                                label="فروش حواله" 
                                actual={havalehActual} 
                                setActual={setHavalehActual} 
                                target={havalehTarget} 
                                setTarget={setHavalehTarget} 
                            />
                        </div>
                        <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-cyan-800 dark:text-cyan-300">ضریب عملکرد (میانگین):</span>
                            <span className="font-mono font-bold text-cyan-900 dark:text-cyan-200 text-lg">
                                {salesPerformanceFactor.toFixed(2)}
                            </span>
                        </div>
                    </section>

                    {/* Step 3: Quality KPIs */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">۳</span>
                            ضریب کیفیت (شاخص‌های کیفی)
                        </h3>
                        <div className="space-y-4">
                            {kpis.map(kpi => (
                                <div key={kpi.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {kpi.label} <span className="text-xs text-slate-400">(وزن: {kpi.weight}٪)</span>
                                        </label>
                                        <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">{kpi.score}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={kpi.score} 
                                        onChange={e => handleKpiChange(kpi.id, Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">ضریب کیفیت:</span>
                            <span className="font-mono font-bold text-purple-900 dark:text-purple-200 text-lg">
                                {qualityFactor.toFixed(2)}
                            </span>
                        </div>
                    </section>

                    {/* Step 4: Attendance */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs">۴</span>
                            ضریب انضباط (مدل ناحیه‌ای)
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">مجموع کسر کار/تاخیر ماهانه (دقیقه)</label>
                                <input 
                                    type="number" 
                                    value={delayMinutes} 
                                    onChange={e => setDelayMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-xl"
                                    placeholder="0"
                                />
                            </div>
                            
                            <div className={`w-full sm:w-1/2 p-4 rounded-xl border transition-colors duration-300 ${currentZone.bgColor} ${currentZone.color.replace('text-', 'border-').replace('600', '200')}`}>
                                <p className="text-xs font-bold opacity-80 mb-1">وضعیت:</p>
                                <div className={`text-lg font-black mb-2 ${currentZone.color}`}>
                                    {currentZone.label}
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold bg-white/50 dark:bg-black/10 p-2 rounded-lg">
                                    <span>ضریب اعمالی:</span>
                                    <span className="font-mono text-lg">{currentZone.factor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Zone Legend */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {ZONES.map(z => (
                                <div key={z.name} className={`text-[10px] px-2 py-1 rounded border ${Number(delayMinutes) >= z.range[0] && Number(delayMinutes) <= z.range[1] ? 'opacity-100 ring-2 ring-offset-1 ring-teal-500 font-bold' : 'opacity-50 grayscale'}`}
                                    style={{ backgroundColor: z.name === 'green' ? '#ecfdf5' : z.name === 'yellow1' ? '#fffbeb' : z.name === 'yellow2' ? '#fff7ed' : '#fff1f2', color: '#333' }}
                                >
                                    {z.label}: {z.factor}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Right Column: Result Sticky */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                            
                            <h3 className="text-lg font-bold mb-6 text-center border-b border-white/10 pb-4">نتیجه نهایی محاسبه</h3>
                            
                            <div className="space-y-4 mb-8 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">پورسانت خام:</span>
                                    <span className="font-mono">{rawCommission.toLocaleString('fa-IR')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">× ضریب عملکرد فروش:</span>
                                    <span className="font-mono text-cyan-300">{salesPerformanceFactor.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">× ضریب کیفیت:</span>
                                    <span className="font-mono text-purple-300">{qualityFactor.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">× ضریب انضباط:</span>
                                    <span className={`font-mono ${currentZone.name === 'green' ? 'text-emerald-300' : 'text-rose-300'}`}>{currentZone.factor}</span>
                                </div>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl text-center">
                                <p className="text-xs text-slate-400 mb-1">مبلغ قابل پرداخت</p>
                                <p className="text-3xl font-black font-mono tracking-tight text-teal-400">
                                    {Math.round(finalCommission).toLocaleString('fa-IR')}
                                    <span className="text-xs font-sans text-white/60 mr-2">تومان</span>
                                </p>
                            </div>

                            <div className="mt-6 text-[10px] text-center text-slate-500">
                                * محاسبه بر اساس مدل ۴ ضریبی (حجم، کیفیت، انضباط).
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CommissionPage;
