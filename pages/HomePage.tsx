import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, Search, Car, Calendar, ArrowUpRight,
    Users, ShoppingCart, Percent,
    ChevronLeft, ChevronRight, LayoutGrid, FileText, Megaphone,
    Clock, RefreshCw, CheckCircle2, ShieldCheck, CarFront,
    ArrowRightLeft, FileSpreadsheet, Coins
} from 'lucide-react';
import type { ActiveView } from '../App';
import { getConditions, getCarPriceStats } from '../services/api';
import type { CarSaleCondition, CarPriceStats } from '../types';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Search states
    const [priceSearch, setPriceSearch] = useState('');
    const [conditionSearch, setConditionSearch] = useState('');

    const fetchData = React.useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        
        try {
            const [pricesData, conditionsData] = await Promise.all([
                getCarPriceStats().catch(() => []),
                getConditions().catch(() => [])
            ]);
            setPriceStats(pricesData);
            setConditions(conditionsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleRefresh = () => {
            fetchData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, [fetchData]);

    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Filter prices based on search
    const filteredPrices = useMemo(() => {
        if (!priceSearch.trim()) return priceStats;
        const query = priceSearch.toLowerCase().trim();
        return (priceStats || []).filter(stat => 
            (stat?.model_name || '').toLowerCase().includes(query)
        );
    }, [priceStats, priceSearch]);

    // Filter conditions based on search
    const filteredConditions = useMemo(() => {
        if (!conditionSearch.trim()) return conditions;
        const query = conditionSearch.toLowerCase().trim();
        return (conditions || []).filter(cond => 
            (cond?.car_model || '').toLowerCase().includes(query) ||
            (cond?.sale_type || '').toLowerCase().includes(query) ||
            (cond?.pay_type || '').toLowerCase().includes(query)
        );
    }, [conditions, conditionSearch]);

    // Computed Stats
    const availableConditionsCount = useMemo(() => {
        return conditions.filter(c => c.status === 'موجود').length;
    }, [conditions]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
                <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                    <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                    در حال بارگذاری اطلاعات پیشخوان...
                </span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/80 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
                {/* Background Decorative Pattern */}
                <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                سیستم فعال • به‌روزرسانی زنده
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                                {today}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight pt-1">
                            پیشخوان مانیتورینگ و مدیریت خودرو
                        </h1>
                        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                            بررسی لحظه‌ای قیمت بازار خودروها، آخرین بخش‌نامه‌های فروش، مدیریت سفارشات و دسترسی سریع به بخش‌های اجرایی CRM.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/15 backdrop-blur-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>به‌روزرسانی داده‌ها</span>
                        </button>
                        <button
                            onClick={() => onNavigate('car-prices')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>قیمت روز بازار</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* Monitored Cars KPI */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">خودروهای تحت مانیتورینگ</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                                {priceStats.length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">مدل فعال</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            استعلام قیمت از مراجع آنلاین
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CarFront className="w-6 h-6" />
                    </div>
                </div>

                {/* Sales Conditions KPI */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">بخش‌نامه‌های فروش</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                                {conditions.length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">بخش‌نامه</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {availableConditionsCount} بخش‌نامه موجود
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                {/* Orders Shortcut KPI */}
                <div 
                    onClick={() => onNavigate('car-orders')}
                    className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group hover:border-emerald-500/50"
                >
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سفارشات مشتریان</span>
                        <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white pt-1">
                            <span>ثبت و پیگیری</span>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">مدیریت درخواست‌های خرید</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                </div>

                {/* CRM Customers KPI */}
                <div 
                    onClick={() => onNavigate('users')}
                    className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group hover:border-sky-500/50"
                >
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مدیریت سرنخ‌ها و CRM</span>
                        <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white pt-1">
                            <span>بانک مشتریان</span>
                            <ArrowUpRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">پیگیری و گزارش فعالیت‌ها</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Quick Navigation Section (دسترسی سریع) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">
                            دسترسی سریع به بخش‌های اصلی
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                    {[
                        { id: 'car-prices' as ActiveView, label: 'قیمت روز خودروها', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
                        { id: 'conditions' as ActiveView, label: 'شرایط فروش', icon: Percent, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                        { id: 'car-orders' as ActiveView, label: 'سفارشات مشتریان', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        { id: 'users' as ActiveView, label: 'مدیریت مشتریان (سرنخ)', icon: Users, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
                        { id: 'used-cars' as ActiveView, label: 'خودروهای کارکرده', icon: ArrowRightLeft, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                        { id: 'advertising-campaigns' as ActiveView, label: 'کمپین‌های تبلیغاتی', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                        { id: 'reports' as ActiveView, label: 'گزارش‌ها و آمار', icon: FileSpreadsheet, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
                        { id: 'vehicle-exit' as ActiveView, label: 'فرم خروج خودرو', icon: ShieldCheck, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all hover:shadow-md group text-center flex flex-col items-center justify-center gap-2.5 active:scale-95"
                        >
                            <div className={`p-3 rounded-xl ${item.bg} ${item.color} transition-transform group-hover:scale-110`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Content Panels: Car Prices & Sales Conditions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Car Prices Live List */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">قیمت روز خودروها</h3>
                                <p className="text-[10px] text-slate-400">مانیتورینگ قیمت مراجع آنلاین</p>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-48">
                            <input
                                type="text"
                                placeholder="جستجوی مدل خودرو..."
                                value={priceSearch}
                                onChange={(e) => setPriceSearch(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 outline-none focus:border-rose-500 dark:focus:border-rose-400 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                        </div>
                    </div>

                    {/* Body List */}
                    <div className="p-4 space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar flex-grow">
                        {filteredPrices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
                                <Car className="w-10 h-10 stroke-[1.5] opacity-40" />
                                <span className="text-xs font-bold">خودرویی منطبق با جستجوی شما یافت نشد.</span>
                            </div>
                        ) : (
                            filteredPrices.map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 transition-all flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                            <Car className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white">
                                                {stat.model_name}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                به‌روزرسانی: {stat.computed_at ? new Date(stat.computed_at).toLocaleDateString('fa-IR') : 'به‌روز'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-left shrink-0">
                                        <div className="text-xs md:text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                                            {stat.maximum ? stat.maximum.toLocaleString('fa-IR') : '—'} <span className="text-[9px] font-sans font-bold text-slate-400">ریال</span>
                                        </div>
                                        <div className="flex gap-2 justify-end mt-0.5 text-[9px] font-bold text-slate-400">
                                            <span>کف: <span className="font-mono text-slate-600 dark:text-slate-300">{stat.minimum ? stat.minimum.toLocaleString('fa-IR') : '—'}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center mt-auto">
                        <span className="text-[10px] font-bold text-slate-400">مشاهده تحلیل و تفکیک قیمت کلیه مراجع</span>
                        <button 
                            onClick={() => onNavigate('car-prices')}
                            className="inline-flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                        >
                            <span>جدول کامل قیمت‌ها</span>
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>

                {/* 3. Sales Conditions (شرایط فروش) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-850 rounded-[28px] border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">شرایط فروش فعال</h3>
                        </div>
                        <div className="relative w-full sm:w-48">
                            <input
                                type="text"
                                placeholder="جستجوی مدل یا نوع..."
                                value={conditionSearch}
                                onChange={(e) => setConditionSearch(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all text-slate-700 dark:text-slate-300"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                        </div>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredConditions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                                <FileText className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-xs font-bold">بخش‌نامه فعال یا منطبقی یافت نشد.</span>
                            </div>
                        ) : (
                            filteredConditions.map((cond, idx) => (
                                <div key={cond.id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mt-0.5 shrink-0">
                                            <Percent className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{cond.car_model}</p>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    مدل {cond.model}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 mt-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                                                    {cond.sale_type}
                                                </span>
                                                <span>•</span>
                                                <span>{cond.pay_type}</span>
                                                {cond.delivery_time && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {cond.delivery_time}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col justify-between items-center sm:items-end gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            cond.status === 'موجود' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                            'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                        }`}>
                                            {cond.status}
                                        </span>
                                        <p className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 mt-1 sm:mt-0">
                                            {cond.pay_type === 'نقدی' ? 'قیمت:' : 'پیش‌پرداخت:'} <span className="text-sm font-sans font-black text-indigo-600 dark:text-indigo-400">
                                                {cond.initial_deposit ? cond.initial_deposit.toLocaleString('fa-IR') : '—'}
                                            </span> <span className="text-[9px] font-sans font-bold text-slate-400">ریال</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center mt-auto">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">ثبت و مدیریت کامل بخش‌نامه‌ها</span>
                        <button 
                            onClick={() => onNavigate('conditions')}
                            className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                            جزئیات بیشتر
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomePage;
