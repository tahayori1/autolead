import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getConditions, 
    updateCondition, 
    getCars 
} from '../services/api';
import { ConditionStatus, SaleType, PayType } from '../types';
import type { CarSaleCondition, Car } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { 
    Boxes, Search, Filter, RefreshCw, Copy, Download, 
    Plus, Minus, Check, AlertTriangle, AlertCircle, X, ChevronDown, CheckCircle2,
    Calendar, Layers, Palette, DollarSign, Clock, HelpCircle, ArrowUpDown
} from 'lucide-react';

type SortConfig = { key: keyof CarSaleCondition; direction: 'ascending' | 'descending' } | null;

const InventoryPage: React.FC = () => {
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filter and Sort states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<ConditionStatus | 'all'>('all');
    const [selectedSaleType, setSelectedSaleType] = useState<SaleType | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'descending' });

    // Copy Modal State
    const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);

    // Load Data
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [conditionsData, carsData] = await Promise.all([
                getConditions(),
                getCars()
            ]);
            setConditions(conditionsData);
            setCars(carsData);
        } catch (err) {
            setError('خطا در دریافت اطلاعات موجودی و خودروها');
            showToast('خطا در دریافت اطلاعات', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    // Incremental / Decremental Stock Update
    const handleStockChange = async (condition: CarSaleCondition, change: number) => {
        const newQty = Math.max(0, condition.stock_quantity + change);
        if (newQty === condition.stock_quantity) return;

        // Optimistic update
        setConditions(prev => prev.map(c => c.id === condition.id ? { ...c, stock_quantity: newQty } : c));

        try {
            // If stock becomes 0, optionally mark status as sold out, or keep it.
            let updatedStatus = condition.status;
            if (newQty === 0 && condition.status === ConditionStatus.AVAILABLE) {
                updatedStatus = ConditionStatus.SOLD_OUT;
            } else if (newQty > 0 && condition.status === ConditionStatus.SOLD_OUT) {
                updatedStatus = ConditionStatus.AVAILABLE;
            }

            const payload: CarSaleCondition = {
                ...condition,
                stock_quantity: newQty,
                status: updatedStatus
            };

            await updateCondition(condition.id, payload);
            setConditions(prev => prev.map(c => c.id === condition.id ? payload : c));
            showToast(`موجودی ${condition.car_model} با موفقیت بروز شد.`, 'success');
        } catch (err) {
            // Revert on failure
            setConditions(prev => prev.map(c => c.id === condition.id ? condition : c));
            showToast('خطا در بروزرسانی موجودی خودرو در سرور', 'error');
        }
    };

    // Direct input stock update
    const handleDirectStockChange = async (condition: CarSaleCondition, value: string) => {
        const parsedVal = parseInt(value, 10);
        if (isNaN(parsedVal) || parsedVal < 0) return;

        // Optimistic update
        setConditions(prev => prev.map(c => c.id === condition.id ? { ...c, stock_quantity: parsedVal } : c));

        try {
            let updatedStatus = condition.status;
            if (parsedVal === 0 && condition.status === ConditionStatus.AVAILABLE) {
                updatedStatus = ConditionStatus.SOLD_OUT;
            } else if (parsedVal > 0 && condition.status === ConditionStatus.SOLD_OUT) {
                updatedStatus = ConditionStatus.AVAILABLE;
            }

            const payload: CarSaleCondition = {
                ...condition,
                stock_quantity: parsedVal,
                status: updatedStatus
            };

            await updateCondition(condition.id, payload);
            setConditions(prev => prev.map(c => c.id === condition.id ? payload : c));
            showToast(`موجودی با موفقیت به ${parsedVal} تغییر یافت.`, 'success');
        } catch (err) {
            setConditions(prev => prev.map(c => c.id === condition.id ? condition : c));
            showToast('خطا در بروزرسانی تعداد موجودی', 'error');
        }
    };

    // Direct status change
    const handleStatusChange = async (condition: CarSaleCondition, newStatus: ConditionStatus) => {
        if (condition.status === newStatus) return;

        // Optimistic update
        setConditions(prev => prev.map(c => c.id === condition.id ? { ...c, status: newStatus } : c));

        try {
            // If status is set to AVAILABLE but stock was 0, default to 5 or keep as is.
            let finalStock = condition.stock_quantity;
            if (newStatus === ConditionStatus.AVAILABLE && condition.stock_quantity === 0) {
                finalStock = 5; // Default some stock
            } else if (newStatus === ConditionStatus.SOLD_OUT) {
                finalStock = 0;
            }

            const payload: CarSaleCondition = {
                ...condition,
                status: newStatus,
                stock_quantity: finalStock
            };

            await updateCondition(condition.id, payload);
            setConditions(prev => prev.map(c => c.id === condition.id ? payload : c));
            showToast(`وضعیت به «${newStatus}» تغییر یافت.`, 'success');
        } catch (err) {
            setConditions(prev => prev.map(c => c.id === condition.id ? condition : c));
            showToast('خطا در بروزرسانی وضعیت فروش خودرو', 'error');
        }
    };

    // Sorting logic
    const handleSort = (key: keyof CarSaleCondition) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filter & search conditions
    const filteredConditions = useMemo(() => {
        const filtered = conditions.filter(c => {
            const matchesSearch = c.car_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (c.descriptions && c.descriptions.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
            const matchesSaleType = selectedSaleType === 'all' || c.sale_type === selectedSaleType;
            return matchesSearch && matchesStatus && matchesSaleType;
        });

        if (sortConfig !== null) {
            return [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                const aStr = String(aValue ?? '');
                const bStr = String(bValue ?? '');

                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return filtered;
    }, [conditions, searchTerm, selectedStatus, selectedSaleType, sortConfig]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const totalModels = conditions.length;
        const totalStock = conditions.reduce((acc, c) => acc + (c.stock_quantity || 0), 0);
        const availableCount = conditions.filter(c => c.status === ConditionStatus.AVAILABLE).length;
        const availableStock = conditions.filter(c => c.status === ConditionStatus.AVAILABLE).reduce((acc, c) => acc + (c.stock_quantity || 0), 0);
        const capacityFullCount = conditions.filter(c => c.status === ConditionStatus.CAPACITY_FULL).length;
        const soldOutCount = conditions.filter(c => c.status === ConditionStatus.SOLD_OUT).length;

        return {
            totalModels,
            totalStock,
            availableCount,
            availableStock,
            capacityFullCount,
            soldOutCount
        };
    }, [conditions]);

    // CSV Export
    const handleExportCSV = () => {
        if (filteredConditions.length === 0) {
            showToast('هیچ داده‌ای برای خروجی گرفتن وجود ندارد.', 'error');
            return;
        }

        const headers = [
            "شناسه", "مدل خودرو", "سال ساخت", "نوع فروش",
            "نحوه پرداخت", "رنگ‌های موجود", "زمان تحویل",
            "قیمت / پیش‌پرداخت", "تعداد موجودی", "وضعیت"
        ];

        const escapeCSV = (value: any): string => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = filteredConditions.map(c => [
            c.id,
            c.car_model,
            c.model,
            c.sale_type,
            c.pay_type,
            c.colors.join(' - '),
            c.delivery_time,
            c.initial_deposit,
            c.stock_quantity,
            c.status
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM for Excel RTL support
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const date = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
        link.setAttribute("download", `لیست_موجودی_خودرو_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('خروجی اکسل (CSV) با موفقیت دریافت شد.', 'success');
    };

    if (loading) {
        return (
            <div className="flex h-96 justify-center items-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-100 dark:border-rose-950/30 shadow-sm space-y-4">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="text-base font-black text-slate-800 dark:text-white">{error}</h3>
                    <button 
                        onClick={fetchAllData}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all"
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-6 text-right" dir="rtl">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-sky-500 rounded-2xl text-white shadow-md shadow-indigo-100 dark:shadow-none">
                            <Boxes className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white">لیست موجودی خودروها</h2>
                            <p className="text-[11px] lg:text-xs text-slate-400 dark:text-slate-500 font-bold">مدیریت و نظارت بر تعداد موجودی، رنگ‌ها و وضعیت فروش انواع خودروها بر اساس بخشنامه‌ها</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsCopyModalOpen(true)}
                        disabled={filteredConditions.length === 0}
                        className="flex-1 md:flex-initial bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Copy className="w-4 h-4 text-indigo-500" />
                        کپی لیست موجودی 📋
                    </button>
                    
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredConditions.length === 0}
                        className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-100 dark:shadow-none disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        خروجی اکسل (CSV)
                    </button>

                    <button
                        onClick={fetchAllData}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                        title="بروزرسانی داده‌ها"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* KPI Cards / Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Models */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">کل تیپ‌های خودرویی</span>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                            {metrics.totalModels.toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">تیپ</span>
                        </h4>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                        <Layers className="w-6 h-6" />
                    </div>
                </motion.div>

                {/* Total Stock */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">مجموع خودروهای انبار</span>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                            {metrics.totalStock.toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">دستگاه</span>
                        </h4>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                        <Boxes className="w-6 h-6" />
                    </div>
                </motion.div>

                {/* Available Stock */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">موجودی فعال (آماده فروش)</span>
                        <h4 className="text-2xl font-black text-emerald-600 font-mono">
                            {metrics.availableStock.toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">دستگاه</span>
                        </h4>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </motion.div>

                {/* Blocked / Out Of Stock */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">اتمام موجودی / تکمیل ظرفیت</span>
                        <h4 className="text-2xl font-black text-rose-500 font-mono">
                            {(metrics.soldOutCount + metrics.capacityFullCount).toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">مورد</span>
                        </h4>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </motion.div>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در نام خودرو، برند، جزئیات و ..."
                            className="w-full pr-10 pl-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Status */}
                    <div className="w-full lg:w-48 relative">
                        <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                            className="w-full pr-9 pl-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none text-xs font-bold appearance-none cursor-pointer"
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value={ConditionStatus.AVAILABLE}>🟢 موجود در انبار</option>
                            <option value={ConditionStatus.CAPACITY_FULL}>🟡 تکمیل ظرفیت</option>
                            <option value={ConditionStatus.SOLD_OUT}>🔴 فروخته شد (عدم موجودی)</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Filter Sale Type */}
                    <div className="w-full lg:w-48 relative">
                        <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={selectedSaleType}
                            onChange={(e) => setSelectedSaleType(e.target.value as any)}
                            className="w-full pr-9 pl-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none text-xs font-bold appearance-none cursor-pointer"
                        >
                            <option value="all">همه روش‌های فروش</option>
                            <option value={SaleType.FACTORY_REGISTRATION}>ثبت‌نام کارخانه</option>
                            <option value={SaleType.TRANSFER}>حواله</option>
                            <option value={SaleType.LEASING}>لیزینگی</option>
                            <option value={SaleType.NEW_MARKET}>صفر بازار</option>
                            <option value={SaleType.USED}>کارکرده</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Inventory Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                <th onClick={() => handleSort('car_model')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span>مدل و تیپ خودرو</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('model')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span>سال ساخت</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="p-4">کانال جذب / نوع فروش</th>
                                <th className="p-4">نحوه پرداخت</th>
                                <th className="p-4">رنگ‌های موجود</th>
                                <th className="p-4">زمان تحویل</th>
                                <th onClick={() => handleSort('initial_deposit')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span>قیمت / پیش‌پرداخت</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('stock_quantity')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors min-w-[160px]">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span>موجودی انبار</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="p-4 min-w-[140px]">وضعیت خودرو</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {filteredConditions.map((condition) => {
                                const isAvailable = condition.status === ConditionStatus.AVAILABLE;
                                const isCapacityFull = condition.status === ConditionStatus.CAPACITY_FULL;
                                const isSoldOut = condition.status === ConditionStatus.SOLD_OUT;

                                return (
                                    <tr key={condition.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                        {/* Car Model */}
                                        <td className="p-4">
                                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                {condition.car_model}
                                            </div>
                                        </td>
                                        
                                        {/* Model Year */}
                                        <td className="p-4 font-mono font-bold text-slate-500">
                                            {condition.model ? condition.model.toLocaleString('fa-IR', { useGrouping: false }) : '-'}
                                        </td>

                                        {/* Sale Type */}
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black">
                                                {condition.sale_type}
                                            </span>
                                        </td>

                                        {/* Pay Type */}
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                                condition.pay_type === PayType.CASH 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                                                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {condition.pay_type}
                                            </span>
                                        </td>

                                        {/* Colors */}
                                        <td className="p-4">
                                            {condition.colors && condition.colors.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {condition.colors.map((color, idx) => (
                                                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                            {color}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>

                                        {/* Delivery Time */}
                                        <td className="p-4 text-slate-500 font-bold">
                                            {condition.delivery_time || '-'}
                                        </td>

                                        {/* Initial Deposit / Price */}
                                        <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                                            {condition.initial_deposit 
                                                ? `${condition.initial_deposit.toLocaleString('fa-IR')} تومان`
                                                : 'نامشخص'
                                            }
                                        </td>

                                        {/* INTERACTIVE STOCK COUNTER */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5" dir="ltr">
                                                <button
                                                    onClick={() => handleStockChange(condition, 1)}
                                                    className="w-7 h-7 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                                
                                                <input
                                                    type="text"
                                                    value={condition.stock_quantity === 0 ? '0' : condition.stock_quantity}
                                                    onChange={(e) => handleDirectStockChange(condition, e.target.value)}
                                                    className="w-12 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none text-center font-mono font-black text-xs"
                                                />

                                                <button
                                                    onClick={() => handleStockChange(condition, -1)}
                                                    disabled={condition.stock_quantity <= 0}
                                                    className="w-7 h-7 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>

                                        {/* INTERACTIVE STATUS BADGE SELECTOR */}
                                        <td className="p-4">
                                            <div className="relative">
                                                <select
                                                    value={condition.status}
                                                    onChange={(e) => handleStatusChange(condition, e.target.value as ConditionStatus)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-black border-none outline-none cursor-pointer appearance-none ${
                                                        isAvailable 
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                                                            : isCapacityFull
                                                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                                    }`}
                                                >
                                                    <option value={ConditionStatus.AVAILABLE}>🟢 موجود</option>
                                                    <option value={ConditionStatus.CAPACITY_FULL}>🟡 تکمیل ظرفیت</option>
                                                    <option value={ConditionStatus.SOLD_OUT}>🔴 فروخته شد</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {filteredConditions.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                        <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                        هیچ خودرو یا بخشنامه‌ای با فیلترهای کنونی یافت نشد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* COPY SETTINGS MODAL */}
            <CopyInventorySettingsModal 
                isOpen={isCopyModalOpen} 
                onClose={() => setIsCopyModalOpen(false)} 
                conditions={filteredConditions} 
                onCopySuccess={() => showToast('لیست موجودی با موفقیت در حافظه موقت کپی شد! 📋', 'success')}
            />

            {/* Toast Alerts */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
};

// --- CUSTOM MODAL FOR COPYING INVENTORY ---
interface CopyInventorySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conditions: CarSaleCondition[];
    onCopySuccess: () => void;
}

const CopyInventorySettingsModal: React.FC<CopyInventorySettingsModalProps> = ({ isOpen, onClose, conditions, onCopySuccess }) => {
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('https://t.me/kermanmotor2606');
    
    // Toggleable fields to include in copied text
    const [includeModelYear, setIncludeModelYear] = useState(true);
    const [includeSaleType, setIncludeSaleType] = useState(true);
    const [includePayType, setIncludePayType] = useState(true);
    const [includeColors, setIncludeColors] = useState(true);
    const [includeDeliveryTime, setIncludeDeliveryTime] = useState(true);
    const [includePrice, setIncludePrice] = useState(true);
    const [includeStockQty, setIncludeStockQty] = useState(true);

    // Selected conditions selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Initialize defaults when modal opens
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const date = now.toLocaleDateString('fa-IR');
            const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            setHeaderText(`📋 لیست موجودی خودروها و شرایط فروش فعال\n📅 تاریخ: ${date} - ساعت: ${time}`);
            
            // By default select all conditions passed to modal
            setSelectedIds(new Set(conditions.map(c => c.id)));
        }
    }, [isOpen, conditions]);

    const handleToggleCondition = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
            return next;
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedIds(new Set(conditions.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const generatedText = useMemo(() => {
        const selectedConditions = conditions.filter(c => selectedIds.has(c.id));
        
        const rows = selectedConditions.map((c, index) => {
            let statusEmoji = '🟢';
            if (c.status === ConditionStatus.CAPACITY_FULL) statusEmoji = '🟡';
            if (c.status === ConditionStatus.SOLD_OUT) statusEmoji = '🔴';

            let title = `${statusEmoji} ${c.car_model}`;
            if (includeModelYear && c.model) {
                title += ` (مدل ${c.model.toLocaleString('fa-IR', { useGrouping: false })})`;
            }

            let lines = [title];

            if (includeSaleType && c.sale_type) {
                lines.push(`🔹 کانال جذب/فروش: ${c.sale_type}`);
            }
            if (includePayType && c.pay_type) {
                lines.push(`💳 نحوه پرداخت: ${c.pay_type}`);
            }
            if (includeColors && c.colors && c.colors.length > 0) {
                lines.push(`🎨 رنگ‌های موجود: ${c.colors.join(' - ')}`);
            }
            if (includeDeliveryTime && c.delivery_time) {
                lines.push(`⏱ زمان تحویل: ${c.delivery_time}`);
            }
            if (includePrice && c.initial_deposit) {
                const label = c.pay_type === 'نقدی' ? 'قیمت' : 'پیش‌پرداخت';
                lines.push(`💰 ${label}: ${c.initial_deposit.toLocaleString('fa-IR')} تومان`);
            }
            if (includeStockQty) {
                if (c.status === ConditionStatus.SOLD_OUT) {
                    lines.push(`📦 وضعیت موجودی: 🔴 اتمام موجودی انبار`);
                } else if (c.status === ConditionStatus.CAPACITY_FULL) {
                    lines.push(`📦 وضعیت موجودی: 🟡 تکمیل ظرفیت ثبت‌نام`);
                } else {
                    lines.push(`📦 تعداد موجودی انبار: ${c.stock_quantity ? c.stock_quantity.toLocaleString('fa-IR') : '۰'} دستگاه`);
                }
            }

            return lines.join('\n');
        });

        return `${headerText}\n\n${rows.join('\n\n───────────────────\n\n')}\n\n${footerText}`;
    }, [
        conditions, selectedIds, headerText, footerText,
        includeModelYear, includeSaleType, includePayType,
        includeColors, includeDeliveryTime, includePrice, includeStockQty
    ]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText).then(() => {
            onCopySuccess();
            onClose();
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden text-right" dir="rtl" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h3 className="text-lg lg:text-xl font-black text-slate-800 dark:text-white">شخصی‌سازی و کپی لیست موجودی 📊📋</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">بخش‌ها و موجودی‌های مورد نظر خود را جهت کپی در پیام‌رسان‌ها گزینش نمایید.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <X className="text-slate-500 w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Settings Side Panel */}
                    <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto border-l border-slate-100 dark:border-slate-700 space-y-6">
                        {/* Header Text Input */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500">متن سرتیتر پیام:</label>
                            <textarea 
                                value={headerText}
                                onChange={e => setHeaderText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Toggle Switches */}
                        <div className="space-y-3">
                            <label className="block text-[11px] font-black text-slate-500">فیلدهای موجود در متن کپی:</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includeModelYear} onChange={e => setIncludeModelYear(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">سال ساخت مدل</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includeSaleType} onChange={e => setIncludeSaleType(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">کانال و روش فروش</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includePayType} onChange={e => setIncludePayType(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">نحوه پرداخت</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includeColors} onChange={e => setIncludeColors(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">رنگ‌های عرضه شده</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includeDeliveryTime} onChange={e => setIncludeDeliveryTime(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">زمان تحویل خودرو</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <input type="checkbox" checked={includePrice} onChange={e => setIncludePrice(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">قیمت نهایی / علی‌الحساب</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm col-span-2">
                                    <input type="checkbox" checked={includeStockQty} onChange={e => setIncludeStockQty(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">نمایش تعداد دقیق موجودی (یا برچسب اتمام انبار)</span>
                                </label>
                            </div>
                        </div>

                        {/* Selection list */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[11px] font-black text-slate-500">انتخاب خودروهای موجود ({conditions.length.toLocaleString('fa-IR')} مورد)</label>
                                <div className="flex gap-3">
                                    <button onClick={() => handleSelectAll(true)} className="text-[10px] text-indigo-500 hover:underline font-bold">همه</button>
                                    <button onClick={() => handleSelectAll(false)} className="text-[10px] text-rose-500 hover:underline font-bold">هیچکدام</button>
                                </div>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl shadow-inner">
                                {conditions.map(c => (
                                    <label key={c.id} className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-1 rounded transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(c.id)} 
                                            onChange={() => handleToggleCondition(c.id)} 
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" 
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                                            {c.car_model} ({c.sale_type})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer Text Input */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-500">متن امضا و پاورقی پیام:</label>
                            <input 
                                type="text" 
                                value={footerText}
                                onChange={e => setFooterText(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:border-indigo-500"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Preview Panel (Telegram Style Simulator) */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/60 flex flex-col justify-between">
                        <div className="space-y-2">
                            <span className="text-[11px] font-black text-slate-400 block">پیش‌نمایش نهایی متن خروجی کپی شده:</span>
                            
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-inner whitespace-pre-wrap text-xs leading-relaxed dark:text-slate-200 font-mono select-all selection:bg-indigo-100">
                                {generatedText}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 mt-4">
                            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs">
                                انصراف
                            </button>
                            <button onClick={handleCopy} className="px-8 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 text-xs">
                                <Copy className="w-4 h-4" />
                                کپی در حافظه موقت (Clipboard)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
