import React, { useState, useMemo } from 'react';
import { Calculator, Award, Clock, Target, CheckCircle } from 'lucide-react';

interface KPI {
    id: string;
    label: string;
    weight: number;
    score: number;
}

interface AttendanceZone {
    name: string;
    label: string;
    color: string;
    bgColor: string;
    factor: number;
    range: [number, number];
}

export const CommissionMultiFactorCalculator: React.FC = () => {
    // 1. Raw Commission by Sale Type
    const [havalehProfit, setHavalehProfit] = useState<number | ''>(50000000);
    const [havalehRate, setHavalehRate] = useState<number | ''>(3);

    const [leasingCount, setLeasingCount] = useState<number | ''>(3);
    const [leasingRate, setLeasingRate] = useState<number | ''>(2000000);

    const [usedProfit, setUsedProfit] = useState<number | ''>(80000000);
    const [usedRate, setUsedRate] = useState<number | ''>(10);

    const [factoryCount, setFactoryCount] = useState<number | ''>(2);
    const [factoryRate, setFactoryRate] = useState<number | ''>(1500000);

    // 2. Sales Volume Targets
    const [leasingTarget, setLeasingTarget] = useState<number | ''>(5);
    const [leasingActual, setLeasingActual] = useState<number | ''>(4);
    
    const [factoryTarget, setFactoryTarget] = useState<number | ''>(5);
    const [factoryActual, setFactoryActual] = useState<number | ''>(3);

    const [usedTarget, setUsedTarget] = useState<number | ''>(3);
    const [usedActual, setUsedActual] = useState<number | ''>(3);

    const [havalehTarget, setHavalehTarget] = useState<number | ''>(5);
    const [havalehActual, setHavalehActual] = useState<number | ''>(5);

    // 3. Quality KPIs
    const [kpis, setKpis] = useState<KPI[]>([
        { id: 'acquisition', label: 'جذب مشتری جدید و ورودی CRM', weight: 30, score: 90 },
        { id: 'reporting', label: 'گزارش‌دهی روزانه و ثبت پیگیری‌ها', weight: 20, score: 95 },
        { id: 'teamwork', label: 'روحیه کار تیمی و هماهنگی قولنامه', weight: 30, score: 85 },
        { id: 'csat', label: 'رضایت مشتری خریدار (CSAT)', weight: 20, score: 95 },
    ]);

    // 4. Attendance
    const [delayMinutes, setDelayMinutes] = useState<number | ''>(25);

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

    // Raw Commission
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
                return Math.min(1, a / t); 
            }
            return 0;
        };

        totalAchievement += calculateAchievement(leasingActual, leasingTarget);
        totalAchievement += calculateAchievement(factoryActual, factoryTarget);
        totalAchievement += calculateAchievement(usedActual, usedTarget);
        totalAchievement += calculateAchievement(havalehActual, havalehTarget);

        if (activeTargets === 0) return 1;
        return totalAchievement / activeTargets;
    }, [leasingActual, leasingTarget, factoryActual, factoryTarget, usedActual, usedTarget, havalehActual, havalehTarget]);

    const qualityScore = useMemo(() => {
        const totalWeightedScore = kpis.reduce((acc, kpi) => acc + (kpi.score * kpi.weight), 0);
        return totalWeightedScore / 100;
    }, [kpis]);

    const qualityFactor = qualityScore / 100;

    const finalCommission = rawCommission * salesPerformanceFactor * qualityFactor * currentZone.factor;

    const handleKpiChange = (id: string, val: number) => {
        setKpis(prev => prev.map(k => k.id === id ? { ...k, score: Math.min(100, Math.max(0, val)) } : k));
    };

    const SalesTargetRow = ({ label, actual, setActual, target, setTarget }: { label: string, actual: number | '', setActual: (v: number | '') => void, target: number | '', setTarget: (v: number | '') => void }) => {
        const percent = target && Number(target) > 0 ? Math.min(100, Math.round((Number(actual) / Number(target)) * 100)) : 0;
        return (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
                    <span className={`text-xs font-mono font-bold ${percent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{percent}%</span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <label className="absolute -top-2.5 right-2 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1">تارگت</label>
                        <input 
                            type="number" 
                            value={target} 
                            onChange={e => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-center text-xs border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-teal-500"
                            placeholder="0"
                        />
                    </div>
                    <span className="text-slate-400 text-xs">/</span>
                    <div className="flex-1 relative">
                        <label className="absolute -top-2.5 right-2 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1">فروش</label>
                        <input 
                            type="number" 
                            value={actual} 
                            onChange={e => setActual(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-center text-xs border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-800 outline-none focus:border-teal-500 font-bold text-slate-800 dark:text-white"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left 2 Cols */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Base Commission by sale types */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 mb-5">
                        <span className="w-6 h-6 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">۱</span>
                        پورسانت پایه بر اساس نوع فروش و معاملات
                    </h3>

                    <div className="space-y-4">
                        {/* Havaleh */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3">فروش حواله خودرو</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">مجموع سود خالص حاصل از حواله (تومان)</label>
                                    <input 
                                        type="number" 
                                        value={havalehProfit} 
                                        onChange={e => setHavalehProfit(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">درصد پورسانت (٪)</label>
                                    <input 
                                        type="number" 
                                        value={havalehRate} 
                                        onChange={e => setHavalehRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Leasing */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3">فروش اقساطی و لیزینگی</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">تعداد پرونده‌های لیزینگی موفق</label>
                                    <input 
                                        type="number" 
                                        value={leasingCount} 
                                        onChange={e => setLeasingCount(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">مبلغ پورسانت ثابت هر پرونده (تومان)</label>
                                    <input 
                                        type="number" 
                                        value={leasingRate} 
                                        onChange={e => setLeasingRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Used / Cash */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3">فروش خودرو کارکرده و نقدی</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">مجموع سود کارشناسی و کمیسیون (تومان)</label>
                                    <input 
                                        type="number" 
                                        value={usedProfit} 
                                        onChange={e => setUsedProfit(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">درصد پورسانت (٪)</label>
                                    <input 
                                        type="number" 
                                        value={usedRate} 
                                        onChange={e => setUsedRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex justify-between items-center border border-indigo-100 dark:border-indigo-900/40">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">مجموع پورسانت پایه (خام):</span>
                        <span className="font-mono font-black text-indigo-900 dark:text-indigo-200 text-lg">
                            {rawCommission.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
                        </span>
                    </div>
                </section>

                {/* 2. Target Fulfillment Factor */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold">۲</span>
                        ضریب تحقق تارگت‌های فروش
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <SalesTargetRow label="لیزینگ" actual={leasingActual} setActual={setLeasingActual} target={leasingTarget} setTarget={setLeasingTarget} />
                        <SalesTargetRow label="کارخانه" actual={factoryActual} setActual={setFactoryActual} target={factoryTarget} setTarget={setFactoryTarget} />
                        <SalesTargetRow label="کارکرده" actual={usedActual} setActual={setUsedActual} target={usedTarget} setTarget={setUsedTarget} />
                        <SalesTargetRow label="حواله" actual={havalehActual} setActual={setHavalehActual} target={havalehTarget} setTarget={setHavalehTarget} />
                    </div>
                </section>

                {/* 3. Quality KPIs */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">۳</span>
                        شاخص‌های کیفی و رفتار حرفه‌ای (KPI)
                    </h3>
                    <div className="space-y-4">
                        {kpis.map(kpi => (
                            <div key={kpi.id}>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                    <label className="font-bold text-slate-700 dark:text-slate-300">
                                        {kpi.label} <span className="text-slate-400 font-normal">(وزن: {kpi.weight}٪)</span>
                                    </label>
                                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">{kpi.score} از ۱۰۰</span>
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
                </section>

                {/* 4. Attendance Zone */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold">۴</span>
                        ضریب انضباط و حضور و غیاب
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-1/2">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                مجموع تاخیر یا کسر کار در ماه (دقیقه)
                            </label>
                            <input 
                                type="number" 
                                value={delayMinutes} 
                                onChange={e => setDelayMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-lg font-black text-center"
                                placeholder="0"
                            />
                        </div>
                        
                        <div className={`w-full sm:w-1/2 p-3.5 rounded-2xl border transition-colors ${currentZone.bgColor} ${currentZone.color.replace('text-', 'border-').replace('600', '200')}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] opacity-70">وضعیت انضباطی:</p>
                                    <div className={`text-sm font-black ${currentZone.color}`}>
                                        {currentZone.label}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] opacity-70 block">ضریب:</span>
                                    <span className="font-mono text-base font-black">{currentZone.factor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* Right Sticky Summary */}
            <div className="lg:col-span-1">
                <div className="sticky top-6">
                    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-700">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <h3 className="text-base font-black mb-5 text-center border-b border-white/10 pb-3 flex items-center justify-center gap-2">
                            <Award className="w-5 h-5 text-teal-400" />
                            خلاصه ضرایب و پورسانت نهایی
                        </h3>
                        
                        <div className="space-y-3.5 mb-6 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                <span className="text-slate-400">پورسانت خام پایه:</span>
                                <span className="font-mono font-bold">{rawCommission.toLocaleString('fa-IR')} تومان</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                <span className="text-slate-400">ضریب عملکرد فروش (تارگت):</span>
                                <span className="font-mono font-black text-cyan-400">{salesPerformanceFactor.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                <span className="text-slate-400">ضریب کیفیت (KPI):</span>
                                <span className="font-mono font-black text-purple-400">{qualityFactor.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                <span className="text-slate-400">ضریب انضباط فردی:</span>
                                <span className={`font-mono font-black ${currentZone.factor === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {currentZone.factor}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-center border border-white/10">
                            <p className="text-[11px] text-slate-300 mb-1">مبلغ نهایی قابل پرداخت</p>
                            <p className="text-3xl font-black font-mono tracking-tight text-teal-400">
                                {Math.round(finalCommission).toLocaleString('fa-IR')}
                                <span className="text-xs font-sans text-white/70 mr-1.5">تومان</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
