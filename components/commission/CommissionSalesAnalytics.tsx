import React, { useState, useMemo } from 'react';
import { CommissionDeal } from '../../types';
import { parseSalesPersons } from '../../services/commissionService';
import { 
    Trophy, 
    TrendingUp, 
    DollarSign, 
    Award, 
    BarChart3, 
    PieChart, 
    Users, 
    CheckCircle2, 
    Star, 
    Medal, 
    Flame, 
    Crown, 
    Zap, 
    ArrowUpRight,
    Search,
    Filter,
    Percent,
    ShieldAlert,
    Building2,
    Calendar
} from 'lucide-react';

interface CommissionSalesAnalyticsProps {
    deals: CommissionDeal[];
    currencyUnit: 'RIAL' | 'TOMAN';
    activePeriodName: string;
}

export interface SalesPersonMetric {
    name: string;
    totalDealsCount: number; // تعداد کل معاملات (با تسهیم ۵۰٪)
    totalSalesVolume: number; // حجم کل فروش ریالی
    companyGrossProfit: number; // سود ناخالص ایجاد شده برای شرکت
    earnedCommission: number; // کل پورسانت تعلق گرفته به مشاور
    netCompanyGain: number; // سود خالص شرکت پس از کسر پورسانت
    profitToCommissionRatio: number; // نسبت سودآوری (چند برابر پورسانت برای شرکت سود ایجاد شده)
    anbarSales: number;
    azadSales: number;
    havalehSales: number;
    leasingSales: number;
    registrationSales: number;
    topCarModel: string;
    averageDealSize: number;
    performanceTier: 'STAR' | 'EXCELLENT' | 'GOOD' | 'NORMAL';
}

export const CommissionSalesAnalytics: React.FC<CommissionSalesAnalyticsProps> = ({
    deals,
    currencyUnit,
    activePeriodName
}) => {
    const divisor = currencyUnit === 'TOMAN' ? 10 : 1;
    const unitLabel = currencyUnit === 'TOMAN' ? 'تومان' : 'ریال';

    const [sortBy, setSortBy] = useState<'profit' | 'volume' | 'count' | 'commission'>('profit');
    const [searchQuery, setSearchQuery] = useState('');

    // Predefined staff list
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

    // Compute detailed sales team analytics
    const salesMetrics = useMemo<SalesPersonMetric[]>(() => {
        const map: Record<string, {
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
            carModels: Record<string, number>;
        }> = {};

        const getOrCreate = (name: string) => {
            if (!map[name]) {
                map[name] = {
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
                    carModels: {}
                };
            }
            return map[name];
        };

        // Initialize known staff
        ALL_KNOWN_STAFF.forEach(name => getOrCreate(name));

        // Process all deals
        deals.forEach(deal => {
            const rawPersons = deal.sharedPersons && deal.sharedPersons.length > 0
                ? deal.sharedPersons
                : parseSalesPersons(deal.salesPerson);

            const staffList = rawPersons.length > 0 ? rawPersons : [deal.salesPerson || 'نامشخص'];
            const shareFactor = 1 / staffList.length;

            const dealSales = (deal.salePrice || deal.downPayment || 0) * shareFactor;
            const dealProfit = (deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0)) * shareFactor;
            const dealComm = (deal.commissionAmount || 0) * shareFactor;
            const category = deal.category || 'ANBAR';

            staffList.forEach(staffName => {
                const item = getOrCreate(staffName);
                item.dealsCount += shareFactor;
                item.salesVolume += dealSales;
                item.grossProfit += dealProfit;
                item.commission += dealComm;

                if (category === 'ANBAR') item.anbar += dealSales;
                else if (category === 'AZAD') item.azad += dealSales;
                else if (category === 'HAVALEH') item.havaleh += dealSales;
                else if (category === 'LEASING') item.leasing += dealSales;
                else if (category === 'REGISTRATION') item.registration += dealSales;

                if (deal.carModel) {
                    item.carModels[deal.carModel] = (item.carModels[deal.carModel] || 0) + 1;
                }
            });
        });

        return Object.values(map).map(m => {
            const netCompanyGain = m.grossProfit - m.commission;
            const profitToCommissionRatio = m.commission > 0 ? Number((m.grossProfit / m.commission).toFixed(1)) : (m.grossProfit > 0 ? 99 : 0);
            
            // Determine top car model
            let topCar = '-';
            let maxCount = 0;
            Object.entries(m.carModels).forEach(([car, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topCar = car;
                }
            });

            // Tier evaluation based on sales standard
            let performanceTier: 'STAR' | 'EXCELLENT' | 'GOOD' | 'NORMAL' = 'NORMAL';
            if (m.grossProfit >= 2000000000 || m.dealsCount >= 4) {
                performanceTier = 'STAR';
            } else if (m.grossProfit >= 800000000 || m.dealsCount >= 2) {
                performanceTier = 'EXCELLENT';
            } else if (m.salesVolume > 0 || m.dealsCount >= 1) {
                performanceTier = 'GOOD';
            }

            const averageDealSize = m.dealsCount > 0 ? Math.round(m.salesVolume / m.dealsCount) : 0;

            return {
                name: m.name,
                totalDealsCount: m.dealsCount,
                totalSalesVolume: m.salesVolume,
                companyGrossProfit: m.grossProfit,
                earnedCommission: m.commission,
                netCompanyGain,
                profitToCommissionRatio,
                anbarSales: m.anbar,
                azadSales: m.azad,
                havalehSales: m.havaleh,
                leasingSales: m.leasing,
                registrationSales: m.registration,
                topCarModel: topCar,
                averageDealSize,
                performanceTier
            };
        });
    }, [deals]);

    // Top Performers Identification
    const topByProfit = useMemo(() => {
        return [...salesMetrics].sort((a, b) => b.companyGrossProfit - a.companyGrossProfit)[0];
    }, [salesMetrics]);

    const topByVolume = useMemo(() => {
        return [...salesMetrics].sort((a, b) => b.totalSalesVolume - a.totalSalesVolume)[0];
    }, [salesMetrics]);

    const topByDealsCount = useMemo(() => {
        return [...salesMetrics].sort((a, b) => b.totalDealsCount - a.totalDealsCount)[0];
    }, [salesMetrics]);

    const topByEfficiency = useMemo(() => {
        return [...salesMetrics]
            .filter(m => m.companyGrossProfit > 0 && m.earnedCommission > 0)
            .sort((a, b) => b.profitToCommissionRatio - a.profitToCommissionRatio)[0];
    }, [salesMetrics]);

    // Sorted and filtered list
    const sortedList = useMemo(() => {
        let list = [...salesMetrics];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m => m.name.toLowerCase().includes(q));
        }

        switch (sortBy) {
            case 'profit':
                return list.sort((a, b) => b.companyGrossProfit - a.companyGrossProfit);
            case 'volume':
                return list.sort((a, b) => b.totalSalesVolume - a.totalSalesVolume);
            case 'count':
                return list.sort((a, b) => b.totalDealsCount - a.totalDealsCount);
            case 'commission':
                return list.sort((a, b) => b.earnedCommission - a.earnedCommission);
            default:
                return list;
        }
    }, [salesMetrics, sortBy, searchQuery]);

    // Team aggregates
    const teamTotals = useMemo(() => {
        return salesMetrics.reduce((acc, m) => ({
            totalDeals: acc.totalDeals + m.totalDealsCount,
            totalVolume: acc.totalVolume + m.totalSalesVolume,
            totalGrossProfit: acc.totalGrossProfit + m.companyGrossProfit,
            totalCommission: acc.totalCommission + m.earnedCommission,
            totalNetCompanyGain: acc.totalNetCompanyGain + m.netCompanyGain
        }), {
            totalDeals: 0,
            totalVolume: 0,
            totalGrossProfit: 0,
            totalCommission: 0,
            totalNetCompanyGain: 0
        });
    }, [salesMetrics]);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">

            {/* 1. Spotlight Banner: Top Performers (فروشندگان برتر و سودآورترین کارمندان) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Most Profitable for Company */}
                <div className="p-5 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-amber-300 dark:border-amber-900/40 relative overflow-hidden shadow-sm">
                    <div className="absolute top-3 left-3 text-amber-500/20">
                        <Crown className="w-16 h-16 -mr-4 -mt-4" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Crown className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 block">
                                سودآورترین کارشناس شرکت
                            </span>
                            <span className="text-[10px] text-slate-400">بیشترین سود ناخالص خلق‌شده</span>
                        </div>
                    </div>
                    {topByProfit && topByProfit.companyGrossProfit > 0 ? (
                        <div className="mt-2">
                            <div className="font-black text-base text-slate-900 dark:text-white">
                                {topByProfit.name}
                            </div>
                            <div className="font-mono font-black text-lg text-amber-600 dark:text-amber-400 mt-1">
                                {Math.round(topByProfit.companyGrossProfit / divisor).toLocaleString('fa-IR')}
                                <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                <span>تعداد فروش: {topByProfit.totalDealsCount}</span>
                                <span>سود خالص شرکت: {Math.round(topByProfit.netCompanyGain / divisor).toLocaleString('fa-IR')}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">داده‌ای ثبت نشده است</p>
                    )}
                </div>

                {/* 2. Top by Sales Volume (حجم کل فروش) */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-emerald-300 dark:border-emerald-900/40 relative overflow-hidden shadow-sm">
                    <div className="absolute top-3 left-3 text-emerald-500/20">
                        <TrendingUp className="w-16 h-16 -mr-4 -mt-4" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block">
                                بیشترین حجم فروش ریالی
                            </span>
                            <span className="text-[10px] text-slate-400">گردش مالی و نقدینگی</span>
                        </div>
                    </div>
                    {topByVolume && topByVolume.totalSalesVolume > 0 ? (
                        <div className="mt-2">
                            <div className="font-black text-base text-slate-900 dark:text-white">
                                {topByVolume.name}
                            </div>
                            <div className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 mt-1">
                                {Math.round(topByVolume.totalSalesVolume / divisor).toLocaleString('fa-IR')}
                                <span className="text-xs font-sans text-slate-400 mr-1.5">{unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                <span>خودرو پرفروش: {topByVolume.topCarModel}</span>
                                <span>میانگین هر قرارداد: {Math.round(topByVolume.averageDealSize / divisor).toLocaleString('fa-IR')}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">داده‌ای ثبت نشده است</p>
                    )}
                </div>

                {/* 3. Top by Deal Count (تعداد معاملات) */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-indigo-300 dark:border-indigo-900/40 relative overflow-hidden shadow-sm">
                    <div className="absolute top-3 left-3 text-indigo-500/20">
                        <Trophy className="w-16 h-16 -mr-4 -mt-4" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Trophy className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="text-[11px] font-black text-indigo-800 dark:text-indigo-300 block">
                                رکورددار تعداد قرارداد
                            </span>
                            <span className="text-[10px] text-slate-400">بیشترین تعداد معامله موفق</span>
                        </div>
                    </div>
                    {topByDealsCount && topByDealsCount.totalDealsCount > 0 ? (
                        <div className="mt-2">
                            <div className="font-black text-base text-slate-900 dark:text-white">
                                {topByDealsCount.name}
                            </div>
                            <div className="font-mono font-black text-xl text-indigo-600 dark:text-indigo-400 mt-1">
                                {topByDealsCount.totalDealsCount}
                                <span className="text-xs font-sans text-slate-400 mr-1.5">فقره معامله</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                <span>پورسانت مکتسبه: {Math.round(topByDealsCount.earnedCommission / divisor).toLocaleString('fa-IR')}</span>
                                <span>ارزش فروش: {Math.round(topByDealsCount.totalSalesVolume / divisor).toLocaleString('fa-IR')}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">داده‌ای ثبت نشده است</p>
                    )}
                </div>

                {/* 4. Profit Efficiency / ROI */}
                <div className="p-5 bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent dark:bg-slate-800 rounded-3xl border border-teal-300 dark:border-teal-900/40 relative overflow-hidden shadow-sm">
                    <div className="absolute top-3 left-3 text-teal-500/20">
                        <Zap className="w-16 h-16 -mr-4 -mt-4" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Zap className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="text-[11px] font-black text-teal-800 dark:text-teal-300 block">
                                بالاترین نرخ بازدهی سود (ROI)
                            </span>
                            <span className="text-[10px] text-slate-400">نسبت سود خلق‌شده به پورسانت</span>
                        </div>
                    </div>
                    {topByEfficiency && topByEfficiency.profitToCommissionRatio > 0 ? (
                        <div className="mt-2">
                            <div className="font-black text-base text-slate-900 dark:text-white">
                                {topByEfficiency.name}
                            </div>
                            <div className="font-mono font-black text-xl text-teal-600 dark:text-teal-400 mt-1">
                                {topByEfficiency.profitToCommissionRatio} برابر
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                خلق {Math.round(topByEfficiency.companyGrossProfit / divisor).toLocaleString('fa-IR')} {unitLabel} سود خالص
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">داده‌ای ثبت نشده است</p>
                    )}
                </div>

            </div>

            {/* 2. Visual Comparison Bars (نمودار میله‌ای مقایسه عملکرد مشاوران) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">
                            تحلیل مقایسه‌ای سودآوری و حجم فروش کارشناسان ({activePeriodName})
                        </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        مجموع سود ناخالص تیم: <span className="font-mono font-black text-emerald-600">{Math.round(teamTotals.totalGrossProfit / divisor).toLocaleString('fa-IR')} {unitLabel}</span>
                    </span>
                </div>

                <div className="space-y-3 pt-2">
                    {salesMetrics
                        .filter(m => m.companyGrossProfit > 0 || m.totalSalesVolume > 0)
                        .sort((a, b) => b.companyGrossProfit - a.companyGrossProfit)
                        .map((person, idx) => {
                            const maxProfit = topByProfit?.companyGrossProfit || 1;
                            const profitPercent = Math.max(5, Math.min(100, Math.round((person.companyGrossProfit / maxProfit) * 100)));
                            
                            return (
                                <div key={person.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                {person.name}
                                            </span>
                                            {person.performanceTier === 'STAR' && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    ستاره فروش
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 font-mono text-[11px]">
                                            <span className="text-slate-400">
                                                حجم فروش: {Math.round(person.totalSalesVolume / divisor).toLocaleString('fa-IR')}
                                            </span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                سود شرکت: {Math.round(person.companyGrossProfit / divisor).toLocaleString('fa-IR')} {unitLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                        <div 
                                            className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                            style={{ width: `${profitPercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* 3. Comprehensive Leaderboard Table (ماتریس کامل استاندارد تیم فروش) */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                
                {/* Table Header Controls */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Medal className="w-5 h-5 text-amber-500" />
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white">
                                جدول رتبه‌بندی استاندارد و ارزیابی عملکرد مشاوران فروش
                            </h3>
                            <p className="text-xs text-slate-400">
                                شناسایی فروشنده برتر و سودآور بر اساس شاخص‌های KPI تیم فروش
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[180px]">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="جستجوی نام کارشناس..."
                                className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                        </div>

                        {/* Sort selector */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                            <span className="text-[10px] text-slate-400 px-1 font-bold">مرتب‌سازی:</span>
                            <button
                                onClick={() => setSortBy('profit')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    sortBy === 'profit' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                بیشترین سود شرکت
                            </button>
                            <button
                                onClick={() => setSortBy('volume')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    sortBy === 'volume' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                حجم فروش ریالی
                            </button>
                            <button
                                onClick={() => setSortBy('count')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    sortBy === 'count' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                تعداد معامله
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3 px-3 text-center">رتبه</th>
                                <th className="py-3 px-4">نام کارشناس فروش</th>
                                <th className="py-3 px-3 text-center">تعداد فروش</th>
                                <th className="py-3 px-3.5">حجم کل فروش ({unitLabel})</th>
                                <th className="py-3 px-3.5 text-amber-600 dark:text-amber-400 font-black">سود ناخالص شرکت ({unitLabel})</th>
                                <th className="py-3 px-3.5 text-emerald-600">پورسانت کارشناس ({unitLabel})</th>
                                <th className="py-3 px-3.5 font-bold">سود خالص باقی‌مانده شرکت ({unitLabel})</th>
                                <th className="py-3 px-3 text-center">نرخ بازدهی (ROI)</th>
                                <th className="py-3 px-3 text-center">سطح ارزیابی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {sortedList.map((person, index) => {
                                const isTop1 = index === 0;
                                const isTop2 = index === 1;
                                const isTop3 = index === 2;

                                return (
                                    <tr key={person.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        
                                        {/* Rank with Medal */}
                                        <td className="py-3 px-3 text-center">
                                            {isTop1 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 font-black text-xs">
                                                    🥇 ۱
                                                </span>
                                            ) : isTop2 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 font-black text-xs">
                                                    🥈 ۲
                                                </span>
                                            ) : isTop3 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 dark:text-amber-300 font-black text-xs">
                                                    🥉 ۳
                                                </span>
                                            ) : (
                                                <span className="font-mono text-slate-400 font-bold">{index + 1}</span>
                                            )}
                                        </td>

                                        {/* Staff Name */}
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                                                {person.name}
                                                {isTop1 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                            </div>
                                            {person.topCarModel !== '-' && (
                                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                                    پرفروش‌ترین مدل: {person.topCarModel}
                                                </span>
                                            )}
                                        </td>

                                        {/* Deals Count */}
                                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-white">
                                            {person.totalDealsCount > 0 ? person.totalDealsCount : '-'}
                                        </td>

                                        {/* Total Sales Volume */}
                                        <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                                            {person.totalSalesVolume > 0 ? Math.round(person.totalSalesVolume / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Gross Profit Created for Company */}
                                        <td className="py-3 px-3.5 font-mono font-black text-amber-600 dark:text-amber-400 whitespace-nowrap bg-amber-50/40 dark:bg-amber-950/20">
                                            {person.companyGrossProfit > 0 ? Math.round(person.companyGrossProfit / divisor).toLocaleString('fa-IR') : (person.companyGrossProfit < 0 ? `-${Math.round(Math.abs(person.companyGrossProfit) / divisor).toLocaleString('fa-IR')}` : '-')}
                                        </td>

                                        {/* Earned Commission */}
                                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                            {person.earnedCommission > 0 ? Math.round(person.earnedCommission / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* Net Company Gain */}
                                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                            {person.netCompanyGain > 0 ? Math.round(person.netCompanyGain / divisor).toLocaleString('fa-IR') : '-'}
                                        </td>

                                        {/* ROI Factor */}
                                        <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                                            {person.profitToCommissionRatio > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[11px]">
                                                    {person.profitToCommissionRatio}x
                                                </span>
                                            ) : '-'}
                                        </td>

                                        {/* Performance Tier Badge */}
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {person.performanceTier === 'STAR' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                                    ستاره فروش ⭐
                                                </span>
                                            ) : person.performanceTier === 'EXCELLENT' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                                    عالی 🎯
                                                </span>
                                            ) : person.performanceTier === 'GOOD' ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                    فعال و خوب
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">بدون معامله</span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Totals Footer */}
                        <tfoot className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                            <tr>
                                <td colSpan={2} className="py-3.5 px-4 text-left">
                                    مجموع کل عملکرد تیم فروش:
                                </td>
                                <td className="py-3.5 px-3 text-center font-mono font-black text-indigo-600">
                                    {teamTotals.totalDeals} معامله
                                </td>
                                <td className="py-3.5 px-3.5 font-mono">
                                    {Math.round(teamTotals.totalVolume / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono text-amber-600 dark:text-amber-400">
                                    {Math.round(teamTotals.totalGrossProfit / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono text-emerald-600">
                                    {Math.round(teamTotals.totalCommission / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono text-slate-900 dark:text-white">
                                    {Math.round(teamTotals.totalNetCompanyGain / divisor).toLocaleString('fa-IR')}
                                </td>
                                <td colSpan={2} className="py-3.5 px-3 text-center text-slate-400 font-normal text-[10px]">
                                    استاندارد پورسانت و ارزیابی حسینی خودرو
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

        </div>
    );
};
