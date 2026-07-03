import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Search, Car, Calendar, ArrowUpRight,
    Tag, MessageSquare, Users, ShoppingCart, Percent,
    ChevronRight, LayoutGrid, FileText, Sparkles, Megaphone,
    Clock, BadgeAlert, Coins
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
    
    // Search states
    const [priceSearch, setPriceSearch] = useState('');
    const [conditionSearch, setConditionSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
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
            }
        };
        fetchData();
    }, []);

    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Filter prices based on search
    const filteredPrices = useMemo(() => {
        if (!priceSearch.trim()) return priceStats;
        const query = priceSearch.toLowerCase();
        return priceStats.filter(stat => 
            stat.model_name.toLowerCase().includes(query)
        );
    }, [priceStats, priceSearch]);

    // Filter conditions based on search
    const filteredConditions = useMemo(() => {
        if (!conditionSearch.trim()) return conditions;
        const query = conditionSearch.toLowerCase();
        return conditions.filter(cond => 
            cond.car_model.toLowerCase().includes(query) ||
            cond.sale_type.toLowerCase().includes(query) ||
            cond.pay_type.toLowerCase().includes(query)
        );
    }, [conditions, conditionSearch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">در حال بارگذاری پیشخوان...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>{today}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                        پیشخوان مدیریت و مانیتورینگ خودرو
                    </h2>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    آخرین بروزرسانی سیستم: خودکار
                </div>
            </div>

            {/* 1. Quick Access Section (دسترسی سریع) */}
            <section className="bg-slate-50/50 dark:bg-slate-900/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">دسترسی سریع</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { id: 'car-prices' as ActiveView, label: 'قیمت روز خودروها', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        { id: 'conditions' as ActiveView, label: 'شرایط فروش', icon: Percent, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { id: 'car-orders' as ActiveView, label: 'سفارشات مشتریان', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { id: 'users' as ActiveView, label: 'مدیریت مشتریان (سرنخ)', icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                        { id: 'advertising-campaigns' as ActiveView, label: 'کمپین‌های تبلیغاتی', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { id: 'customer-club' as ActiveView, label: 'باشگاه مشتریان', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-md group text-center flex flex-col items-center justify-center gap-2.5 active:scale-95"
                        >
                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} transition-transform group-hover:scale-110`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* 2 & 3. Price List & Sales Conditions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 2. List of Today's Prices (لیست قیمت روز) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-850 rounded-[28px] border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-rose-500" />
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">لیست قیمت روز خودروها</h3>
                        </div>
                        <div className="relative w-full sm:w-48">
                            <input
                                type="text"
                                placeholder="جستجوی خودرو..."
                                value={priceSearch}
                                onChange={(e) => setPriceSearch(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 outline-none focus:border-rose-400 dark:focus:border-rose-500 transition-all text-slate-700 dark:text-slate-300"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                        </div>
                    </div>

                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredPrices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                                <Car className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-xs font-bold">خودرویی با این مشخصات یافت نشد.</span>
                            </div>
                        ) : (
                            filteredPrices.map((stat, idx) => (
                                <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                                            <Car className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{stat.model_name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">بروزرسانی: {stat.computed_at ? new Date(stat.computed_at).toLocaleDateString('fa-IR') : 'به‌روز'}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-mono font-black text-slate-800 dark:text-white">
                                            {stat.maximum ? stat.maximum.toLocaleString('fa-IR') : '—'} <span className="text-[10px] text-slate-400 font-bold font-sans">ریال</span>
                                        </p>
                                        <div className="flex gap-2 justify-end mt-0.5 text-[9px] font-bold text-slate-400">
                                            <span>کف: <span className="font-mono text-rose-500">{stat.minimum ? stat.minimum.toLocaleString('fa-IR') : '—'}</span></span>
                                            <span>•</span>
                                            <span>میانگین: <span className="font-mono text-indigo-500">{stat.average ? Math.round(stat.average).toLocaleString('fa-IR') : '—'}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center mt-auto">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">مشاهده آمار کامل در بخش قیمت روز</span>
                        <button 
                            onClick={() => onNavigate('car-prices')}
                            className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                            جزئیات بیشتر
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
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
