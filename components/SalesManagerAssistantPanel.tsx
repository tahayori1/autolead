import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
    PieChart, Pie, Cell
} from 'recharts';
import { 
    Target, Flame, Zap, AlertCircle, TrendingUp, BarChart3, 
    PieChart as PieIcon, ChevronDown, ChevronUp, CheckCircle2, 
    Boxes, Sparkles, Building2, Ticket, FileText, Send, Printer, 
    Download, Copy, Check, Eye, X, Plus, Minus, Search, RotateCcw,
    Layers, DollarSign, Calendar, Clock, HelpCircle, Filter, Tag,
    CreditCard, SlidersHorizontal
} from 'lucide-react';
import { ConditionStatus, SaleType, PayType } from '../types';
import type { CarSaleCondition, Car } from '../types';

interface SalesManagerAssistantPanelProps {
    conditions: CarSaleCondition[];
    allCarsCatalog: Car[];
    onFilterByModel?: (modelName: string) => void;
    onFilterByStockType?: (type: 'high_stock' | 'single_unit' | 'out_of_stock' | 'all') => void;
    currentStockFilter?: 'high_stock' | 'single_unit' | 'out_of_stock' | 'all';
    onStockChange?: (condition: CarSaleCondition, change: number) => void;
    onDirectStockChange?: (condition: CarSaleCondition, value: string) => void;
    onStatusChange?: (condition: CarSaleCondition, newStatus: ConditionStatus) => void;
    onSwitchTab?: (tab: 'warehouse' | 'transfer' | 'customer') => void;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

const COLORS = [
    '#6366f1', // indigo
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
];

const DEFAULT_DEALERSHIP_FOOTER = `☎️ تماس با واحد فروش:
(پاسخگویی ۹ تا ۲۰)

07191690906

📌 آدرس نمایندگی ۲۶۰۶:
 شیراز، چهارراه بنفشه، نرسیده به فلکه هنگ، روبروی کوچه ۱۸`;

export const SalesManagerAssistantPanel: React.FC<SalesManagerAssistantPanelProps> = ({
    conditions,
    allCarsCatalog,
    onFilterByModel,
    onFilterByStockType,
    currentStockFilter = 'all',
    onStockChange,
    onDirectStockChange,
    onStatusChange,
    onSwitchTab,
    showToast
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [activeChartTab, setActiveChartTab] = useState<'frequency' | 'share'>('frequency');

    // Multi-Select Filters for Sale Types, Payment Methods, and Manufacturing Years
    const [selectedSaleTypes, setSelectedSaleTypes] = useState<string[]>([]);
    const [selectedPayTypes, setSelectedPayTypes] = useState<string[]>([]);
    const [selectedModelYears, setSelectedModelYears] = useState<string[]>([]);

    // Modals for Report Generation
    const [isManagerReportModalOpen, setIsManagerReportModalOpen] = useState<boolean>(false);
    const [isSpecialistsBriefModalOpen, setIsSpecialistsBriefModalOpen] = useState<boolean>(false);

    // Internal radar table search and filter
    const [radarSearchTerm, setRadarSearchTerm] = useState<string>('');
    const [radarStockFilter, setRadarStockFilter] = useState<'high_stock' | 'single_unit' | 'out_of_stock' | 'all'>('all');

    // Available Sale Types, Pay Types, and Model Years dynamically derived from catalogue & conditions
    const availableSaleTypes = useMemo(() => {
        const set = new Set<string>();
        [
            SaleType.NEW_MARKET,
            SaleType.USED,
            SaleType.TRANSFER,
            SaleType.FACTORY_REGISTRATION,
            SaleType.LEASING
        ].forEach(val => set.add(val));
        conditions.forEach(c => {
            if (c.sale_type) set.add(c.sale_type);
        });
        return Array.from(set);
    }, [conditions]);

    const availablePayTypes = useMemo(() => {
        const set = new Set<string>();
        [PayType.CASH, PayType.INSTALLMENT, PayType.PRE_SALE].forEach(val => set.add(val));
        conditions.forEach(c => {
            if (c.pay_type) set.add(c.pay_type);
        });
        return Array.from(set);
    }, [conditions]);

    const availableModelYears = useMemo(() => {
        const set = new Set<string>();
        conditions.forEach(c => {
            if (c.model) set.add(String(c.model).trim());
        });
        (allCarsCatalog || []).forEach(car => {
            if (car.model) set.add(String(car.model).trim());
        });
        return Array.from(set).filter(Boolean).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [conditions, allCarsCatalog]);

    const toggleSaleType = (type: string) => {
        setSelectedSaleTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const togglePayType = (type: string) => {
        setSelectedPayTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleModelYear = (year: string) => {
        setSelectedModelYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    const clearMultiFilters = () => {
        setSelectedSaleTypes([]);
        setSelectedPayTypes([]);
        setSelectedModelYears([]);
    };

    // Filter relevant conditions based on Multi-Selected Filters
    const scopedConditions = useMemo(() => {
        return conditions.filter(c => {
            // Multi-Select Sale Type Filter
            if (selectedSaleTypes.length > 0) {
                if (!selectedSaleTypes.includes(c.sale_type)) {
                    return false;
                }
            }

            // Multi-Select Pay Type Filter
            if (selectedPayTypes.length > 0) {
                if (!selectedPayTypes.includes(c.pay_type)) {
                    return false;
                }
            }

            // Multi-Select Model Year Filter
            if (selectedModelYears.length > 0) {
                const cYear = c.model ? String(c.model).trim() : '';
                if (!selectedModelYears.includes(cYear)) {
                    return false;
                }
            }

            return true;
        });
    }, [conditions, selectedSaleTypes, selectedPayTypes, selectedModelYears]);

    // 1. Group stock by model name
    const modelStockStats = useMemo(() => {
        const statsMap = new Map<string, {
            modelName: string;
            totalStock: number;
            warehouseStock: number;
            transferStock: number;
            availableCount: number;
            variantsCount: number;
            years: Set<number>;
            saleTypes: Set<string>;
            minDeposit: number;
            maxDeposit: number;
            minTotalPrice: number;
            maxTotalPrice: number;
            isSingleUnit: boolean;
            conditions: CarSaleCondition[];
        }>();

        scopedConditions.forEach(c => {
            const cleanName = c.car_model.trim();
            const existing = statsMap.get(cleanName) || {
                modelName: cleanName,
                totalStock: 0,
                warehouseStock: 0,
                transferStock: 0,
                availableCount: 0,
                variantsCount: 0,
                years: new Set<number>(),
                saleTypes: new Set<string>(),
                minDeposit: c.initial_deposit || 0,
                maxDeposit: c.initial_deposit || 0,
                minTotalPrice: c.car_price || 0,
                maxTotalPrice: c.car_price || 0,
                isSingleUnit: false,
                conditions: []
            };

            const qty = c.stock_quantity || 0;
            existing.totalStock += qty;

            if (c.sale_type === SaleType.TRANSFER) {
                existing.transferStock += qty;
            } else {
                existing.warehouseStock += qty;
            }

            if (c.status === ConditionStatus.AVAILABLE) {
                existing.availableCount += 1;
            }
            existing.variantsCount += 1;
            if (c.model) existing.years.add(c.model);
            if (c.sale_type) existing.saleTypes.add(c.sale_type);

            if (c.initial_deposit) {
                if (existing.minDeposit === 0 || c.initial_deposit < existing.minDeposit) existing.minDeposit = c.initial_deposit;
                if (c.initial_deposit > existing.maxDeposit) existing.maxDeposit = c.initial_deposit;
            }
            if (c.car_price) {
                if (existing.minTotalPrice === 0 || c.car_price < existing.minTotalPrice) existing.minTotalPrice = c.car_price;
                if (c.car_price > existing.maxTotalPrice) existing.maxTotalPrice = c.car_price;
            }

            existing.conditions.push(c);
            statsMap.set(cleanName, existing);
        });

        // Convert to array
        const list = Array.from(statsMap.values()).map(item => ({
            ...item,
            isSingleUnit: item.totalStock === 1
        }));

        // Sort by total stock descending (Highest stock first)
        list.sort((a, b) => b.totalStock - a.totalStock);
        return list;
    }, [scopedConditions]);

    // 2. High Stock Models (Surplus / Priority Push) - Models with highest stock >= 2
    const highStockModels = useMemo(() => {
        return modelStockStats.filter(m => m.totalStock >= 2);
    }, [modelStockStats]);

    // 3. Single Unit Models (آخرین دستگاه / تک‌موجود)
    const singleUnitModels = useMemo(() => {
        return modelStockStats.filter(m => m.totalStock === 1);
    }, [modelStockStats]);

    // 4. Out of Stock / Missing Models (خودروهایی که نداریم / اتمام موجودی)
    const outOfStockInfo = useMemo(() => {
        const soldOutConditions = scopedConditions.filter(c => 
            c.status === ConditionStatus.SOLD_OUT || 
            c.stock_quantity === 0 || 
            c.status === ConditionStatus.CAPACITY_FULL
        );

        const availableModelNames: string[] = modelStockStats
            .filter(m => m.totalStock > 0)
            .map(m => m.modelName.toLowerCase());

        const catalogMissing = allCarsCatalog.filter(car => {
            const carNameLower = car.name.toLowerCase();
            return !availableModelNames.some((name: string) => 
                name.includes(carNameLower) || carNameLower.includes(name)
            );
        });

        return {
            soldOutConditions,
            catalogMissing,
            totalUnavailableCount: soldOutConditions.length + catalogMissing.length
        };
    }, [scopedConditions, modelStockStats, allCarsCatalog]);

    // 5. Total Stock & Financial Estimates
    const totals = useMemo(() => {
        let totalUnits = 0;
        let warehouseUnits = 0;
        let transferUnits = 0;
        let estimatedCapitalDeposit = 0; // Total estimated deposit capital

        scopedConditions.forEach(c => {
            const qty = c.stock_quantity || 0;
            totalUnits += qty;
            if (c.sale_type === SaleType.TRANSFER) {
                transferUnits += qty;
            } else {
                warehouseUnits += qty;
            }
            if (c.initial_deposit && qty > 0) {
                estimatedCapitalDeposit += c.initial_deposit * qty;
            }
        });

        return {
            totalUnits,
            warehouseUnits,
            transferUnits,
            estimatedCapitalDeposit
        };
    }, [scopedConditions]);

    // 6. Chart Data - Frequency distribution
    const chartFrequencyData = useMemo(() => {
        return modelStockStats
            .filter(m => m.totalStock > 0)
            .slice(0, 10)
            .map(m => ({
                name: m.modelName.length > 14 ? m.modelName.substring(0, 14) + '...' : m.modelName,
                fullName: m.modelName,
                موجودی_کل: m.totalStock,
                انبار_فیزیکی: m.warehouseStock,
                حواله: m.transferStock,
                تعداد_تیپ: m.variantsCount
            }));
    }, [modelStockStats]);

    // 7. Pie chart data - Share of total stock
    const chartPieData = useMemo(() => {
        const top6 = modelStockStats.filter(m => m.totalStock > 0).slice(0, 6);
        const topSum = top6.reduce((acc, m) => acc + m.totalStock, 0);
        const othersSum = totals.totalUnits - topSum;

        const data = top6.map((m) => ({
            name: m.modelName,
            value: m.totalStock,
            percent: totals.totalUnits > 0 ? Math.round((m.totalStock / totals.totalUnits) * 100) : 0
        }));

        if (othersSum > 0) {
            data.push({
                name: 'سایر مدل‌ها',
                value: othersSum,
                percent: Math.round((othersSum / totals.totalUnits) * 100)
            });
        }

        return data;
    }, [modelStockStats, totals.totalUnits]);

    // Filtered conditions for the Radar Unified Table
    const radarTableConditions = useMemo(() => {
        return scopedConditions.filter(c => {
            const matchesSearch = !radarSearchTerm || 
                c.car_model.toLowerCase().includes(radarSearchTerm.toLowerCase()) ||
                (c.descriptions && c.descriptions.toLowerCase().includes(radarSearchTerm.toLowerCase()));

            let matchesStock = true;
            if (radarStockFilter === 'high_stock') {
                matchesStock = (c.stock_quantity || 0) >= 2;
            } else if (radarStockFilter === 'single_unit') {
                matchesStock = (c.stock_quantity || 0) === 1;
            } else if (radarStockFilter === 'out_of_stock') {
                matchesStock = (c.stock_quantity || 0) === 0 || c.status === ConditionStatus.SOLD_OUT || c.status === ConditionStatus.CAPACITY_FULL;
            }

            return matchesSearch && matchesStock;
        }).sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0));
    }, [scopedConditions, radarSearchTerm, radarStockFilter]);

    // Custom Tooltip for Bar Chart
    const CustomBarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-bold border border-slate-700 text-right space-y-1" dir="rtl">
                    <p className="text-indigo-300 font-black mb-1">{data.fullName}</p>
                    <p className="text-emerald-400">📦 مجموع کل: {data.موجودی_کل.toLocaleString('fa-IR')} دستگاه/فقره</p>
                    {data.انبار_فیزیکی > 0 && <p className="text-sky-300 text-[11px]">🏢 انبار/نمایشگاه: {data.انبار_فیزیکی.toLocaleString('fa-IR')}</p>}
                    {data.حواله > 0 && <p className="text-amber-300 text-[11px]">🎫 حواله: {data.حواله.toLocaleString('fa-IR')}</p>}
                    <p className="text-slate-400 text-[10px]">تعداد شرایط و تیپ: {data.تعداد_تیپ} مورد</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Top Command & Strategy Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 lg:p-7 border border-indigo-800/50 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
                {/* Ambient Background Glows */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-600/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 relative z-10 pb-5 border-b border-indigo-900/60">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3.5 bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
                            <Target className="w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    دستیار هوشمند و رادار استراتژیک مدیر فروش
                                </h3>
                                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>رصد یکپارچه انبار، نمایشگاه و حواله</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-1">
                                تحلیل لحظه‌ای ظرفیت‌ها، تفکیک خودروهای پرموجودی، رصد آخرین دستگاه‌ها و ابزار اختصاصی تولید گزارش مدیریت و کارشناسان
                            </p>
                        </div>
                    </div>

                    {/* Quick Report Generation Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                        <button
                            onClick={() => setIsManagerReportModalOpen(true)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer border border-emerald-400/30"
                        >
                            <FileText className="w-4 h-4" />
                            <span>تهیه گزارش مدیریتی 📑</span>
                        </button>

                        <button
                            onClick={() => setIsSpecialistsBriefModalOpen(true)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 transition-all cursor-pointer border border-indigo-400/30"
                        >
                            <Send className="w-4 h-4" />
                            <span>ابلاغیه و تارگت کارشناسان 📢</span>
                        </button>

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700/50 cursor-pointer"
                            title="نمایش / پنهان‌سازی نمودارها"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span>{isExpanded ? 'بستن نمودارها' : 'نمایش نمودارها'}</span>
                        </button>
                    </div>
                </div>

                {/* Header Summary & Reset */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 relative z-10">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-bold">تعداد کل رکوردهای منطبق بر فیلترها:</span>
                        <span className="font-mono font-black text-amber-300 bg-slate-850 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                            {scopedConditions.length.toLocaleString('fa-IR')} مورد
                        </span>
                    </div>
                </div>

                {/* Multi-Select Filters Bar for Sale Types, Pay Types, and Model Years */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-indigo-900/50 mt-3 relative z-10 space-y-3.5 shadow-lg shadow-black/20">
                    {/* Header with quick stats and reset button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                <Filter className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-black text-slate-200">فیلترهای چندانتخابی گزارشات دستیار و رادار:</span>
                            {(selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 flex items-center gap-1">
                                    <span>{(selectedSaleTypes.length + selectedPayTypes.length + selectedModelYears.length).toLocaleString('fa-IR')} فیلتر همزمان فعال</span>
                                </span>
                            )}
                        </div>

                        {(selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) && (
                            <button
                                onClick={clearMultiFilters}
                                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 px-2.5 py-1 rounded-xl"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>حذف تمام فیلترهای انتخابی</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Row 1: Sale Types (نوع عرضه - چندانتخابی) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <div className="min-w-[120px] flex items-center gap-1.5 text-[11px] font-black text-sky-400">
                            <Tag className="w-3.5 h-3.5" />
                            <span>نوع عرضه (چندانتخابی):</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            <button
                                onClick={() => setSelectedSaleTypes([])}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                    selectedSaleTypes.length === 0
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400'
                                        : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                                }`}
                            >
                                همه انواع عرضه
                            </button>
                            {availableSaleTypes.map(type => {
                                const isSelected = selectedSaleTypes.includes(type);
                                const count = conditions.filter(c => {
                                    if (selectedPayTypes.length > 0 && !selectedPayTypes.includes(c.pay_type)) return false;
                                    if (selectedModelYears.length > 0 && !selectedModelYears.includes(String(c.model).trim())) return false;
                                    return c.sale_type === type;
                                }).length;

                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleSaleType(type)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-sky-500 text-white shadow-md shadow-sky-950/50 border border-sky-300 ring-2 ring-sky-400/30'
                                                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 border border-slate-700/60'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`}></span>
                                        <span>{type}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                            isSelected ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                            {count.toLocaleString('fa-IR')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter Row 2: Pay Types (روش پرداخت - چندانتخابی) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2 border-t border-slate-800/60">
                        <div className="min-w-[120px] flex items-center gap-1.5 text-[11px] font-black text-emerald-400">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>روش پرداخت (چندانتخابی):</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            <button
                                onClick={() => setSelectedPayTypes([])}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                    selectedPayTypes.length === 0
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50 border border-emerald-400'
                                        : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                                }`}
                            >
                                همه روش‌های پرداخت
                            </button>
                            {availablePayTypes.map(type => {
                                const isSelected = selectedPayTypes.includes(type);
                                const count = conditions.filter(c => {
                                    if (selectedSaleTypes.length > 0 && !selectedSaleTypes.includes(c.sale_type)) return false;
                                    if (selectedModelYears.length > 0 && !selectedModelYears.includes(String(c.model).trim())) return false;
                                    return c.pay_type === type;
                                }).length;

                                return (
                                    <button
                                        key={type}
                                        onClick={() => togglePayType(type)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-300 ring-2 ring-emerald-400/30'
                                                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 border border-slate-700/60'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`}></span>
                                        <span>{type}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                            isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                            {count.toLocaleString('fa-IR')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter Row 3: Model Years (سال ساخت - چندانتخابی) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2 border-t border-slate-800/60">
                        <div className="min-w-[120px] flex items-center gap-1.5 text-[11px] font-black text-amber-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>سال ساخت (چندانتخابی):</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            <button
                                onClick={() => setSelectedModelYears([])}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                    selectedModelYears.length === 0
                                        ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50 border border-amber-400'
                                        : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                                }`}
                            >
                                همه سال‌های ساخت
                            </button>
                            {availableModelYears.map(year => {
                                const isSelected = selectedModelYears.includes(year);
                                const count = conditions.filter(c => {
                                    if (selectedSaleTypes.length > 0 && !selectedSaleTypes.includes(c.sale_type)) return false;
                                    if (selectedPayTypes.length > 0 && !selectedPayTypes.includes(c.pay_type)) return false;
                                    return String(c.model).trim() === year;
                                }).length;

                                return (
                                    <button
                                        key={year}
                                        onClick={() => toggleModelYear(year)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-950/50 border border-amber-300 ring-2 ring-amber-400/30'
                                                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 border border-slate-700/60'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`}></span>
                                        <span>مدل {year}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                            isSelected ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                            {count.toLocaleString('fa-IR')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 4 Unified KPI Counters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 relative z-10">
                    {/* KPI 1: Total Unified Stock */}
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-black">مجموع ظرفیت قابل واگذاری</span>
                            <Boxes className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h4 className="text-2xl font-black text-emerald-400 font-mono">
                                {totals.totalUnits.toLocaleString('fa-IR')}
                            </h4>
                            <span className="text-xs text-slate-400 font-bold">دستگاه / فقره</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                            <span>انبار/نمایشگاه: {totals.warehouseUnits.toLocaleString('fa-IR')}</span>
                            <span>حواله: {totals.transferUnits.toLocaleString('fa-IR')}</span>
                        </div>
                    </div>

                    {/* KPI 2: High Stock (Surplus) */}
                    <div 
                        onClick={() => {
                            setRadarStockFilter(radarStockFilter === 'high_stock' ? 'all' : 'high_stock');
                            if (onFilterByStockType) onFilterByStockType(radarStockFilter === 'high_stock' ? 'all' : 'high_stock');
                        }}
                        className={`p-4 rounded-2xl border space-y-1 transition-all cursor-pointer ${
                            radarStockFilter === 'high_stock'
                                ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30'
                                : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-black text-rose-300">اولویت ۱: انباشت موجودی</span>
                            <Flame className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h4 className="text-2xl font-black text-rose-400 font-mono">
                                {highStockModels.length.toLocaleString('fa-IR')}
                            </h4>
                            <span className="text-xs text-slate-400 font-bold">مدل ({highStockModels.reduce((acc, m) => acc + m.totalStock, 0).toLocaleString('fa-IR')} دستگاه)</span>
                        </div>
                        <p className="text-[10px] text-rose-300/80 truncate">
                            نیازمند تمرکز فروش و آفر ویژه
                        </p>
                    </div>

                    {/* KPI 3: Single Unit (Rush) */}
                    <div 
                        onClick={() => {
                            setRadarStockFilter(radarStockFilter === 'single_unit' ? 'all' : 'single_unit');
                            if (onFilterByStockType) onFilterByStockType(radarStockFilter === 'single_unit' ? 'all' : 'single_unit');
                        }}
                        className={`p-4 rounded-2xl border space-y-1 transition-all cursor-pointer ${
                            radarStockFilter === 'single_unit'
                                ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
                                : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-black text-amber-300">اولویت ۲: آخرین دستگاه‌ها</span>
                            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h4 className="text-2xl font-black text-amber-400 font-mono">
                                {singleUnitModels.length.toLocaleString('fa-IR')}
                            </h4>
                            <span className="text-xs text-slate-400 font-bold">مدل تک‌موجود</span>
                        </div>
                        <p className="text-[10px] text-amber-300/80 truncate">
                            فرصت بستن سریع و مانور محدودیت
                        </p>
                    </div>

                    {/* KPI 4: Shortage / Out of stock */}
                    <div 
                        onClick={() => {
                            setRadarStockFilter(radarStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
                            if (onFilterByStockType) onFilterByStockType(radarStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
                        }}
                        className={`p-4 rounded-2xl border space-y-1 transition-all cursor-pointer ${
                            radarStockFilter === 'out_of_stock'
                                ? 'bg-slate-800 border-slate-500 ring-2 ring-slate-500/30'
                                : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80'
                        }`}
                    >
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-black">رصد کسری و اتمام ظرفیت</span>
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h4 className="text-2xl font-black text-slate-300 font-mono">
                                {outOfStockInfo.totalUnavailableCount.toLocaleString('fa-IR')}
                            </h4>
                            <span className="text-xs text-slate-400 font-bold">مورد بدون موجودی</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                            جهت هدایت به مدل‌های جایگزین
                        </p>
                    </div>
                </div>

                {/* 3 Strategic Priority Pillars (Interactive Clickable Badges) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 relative z-10">
                    {/* Pillar 1: High Stock (Surplus / Target Push) */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                                    <Flame className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-black text-white">مدل‌های اولویت ۱ (انباشت موجودی)</span>
                            </div>
                            <span className="text-[10px] text-rose-300 font-mono font-bold">
                                {highStockModels.reduce((acc, m) => acc + m.totalStock, 0).toLocaleString('fa-IR')} عدد
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {highStockModels.slice(0, 5).map(m => (
                                <button 
                                    key={m.modelName} 
                                    onClick={() => setRadarSearchTerm(m.modelName)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-black bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/30 flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <span>{m.modelName}</span>
                                    <span className="font-mono text-amber-300">({m.totalStock.toLocaleString('fa-IR')})</span>
                                </button>
                            ))}
                            {highStockModels.length === 0 && (
                                <span className="text-[10px] text-slate-500">انباشت موجودی بحرانی ثبت نشده است.</span>
                            )}
                        </div>
                    </div>

                    {/* Pillar 2: Single Unit Models */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                                    <Zap className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-black text-white">تک‌موجودها (آخرین دستگاه)</span>
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono font-bold">
                                {singleUnitModels.length.toLocaleString('fa-IR')} مدل
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {singleUnitModels.slice(0, 5).map(m => (
                                <button 
                                    key={m.modelName} 
                                    onClick={() => setRadarSearchTerm(m.modelName)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-400/30 flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <span>{m.modelName}</span>
                                    <span className="text-amber-400">⚡ تک</span>
                                </button>
                            ))}
                            {singleUnitModels.length === 0 && (
                                <span className="text-[10px] text-slate-500">هیچ خودرویی تک‌موجود نیست.</span>
                            )}
                        </div>
                    </div>

                    {/* Pillar 3: Out of Stock */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-slate-700 text-slate-300">
                                    <AlertCircle className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-black text-white">کسری و ناموجودها</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                                {outOfStockInfo.totalUnavailableCount.toLocaleString('fa-IR')} مورد
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {outOfStockInfo.soldOutConditions.slice(0, 3).map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={() => setRadarSearchTerm(c.car_model)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <span>{c.car_model}</span>
                                    <span className="text-rose-400">🚫</span>
                                </button>
                            ))}
                            {outOfStockInfo.catalogMissing.slice(0, 2).map(car => (
                                <span 
                                    key={car.id} 
                                    className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1"
                                >
                                    <span>{car.name}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* EXPANDABLE SECTION: CHARTS & FREQUENCY REPORT */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6 pt-5 mt-5 border-t border-slate-800/80 relative z-10"
                        >
                            {/* Chart Tabs & Sub-header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-300">گزارش تصویری فراوانی و توزیع ظرفیت کل ناوگان:</span>
                                </div>

                                <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                                    <button
                                        onClick={() => setActiveChartTab('frequency')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                                            activeChartTab === 'frequency'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        <span>فراوانی موجودی (تعداد)</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveChartTab('share')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                                            activeChartTab === 'share'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <PieIcon className="w-3.5 h-3.5" />
                                        <span>سهم مدل‌ها از کل موجودی (درصد)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Chart Render */}
                            <div className="bg-slate-950/70 p-4 lg:p-6 rounded-2xl border border-slate-800/80">
                                {activeChartTab === 'frequency' ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold">
                                            <span>توزیع تعداد دستگاه/حواله به تفکیک مدل‌ها (۱۰ مدل با بیشترین فراوانی)</span>
                                            <span className="text-indigo-400 font-mono font-bold">مجموع کل: {totals.totalUnits.toLocaleString('fa-IR')} دستگاه/فقره</span>
                                        </div>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartFrequencyData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                                                    <XAxis 
                                                        dataKey="name" 
                                                        stroke="#64748b" 
                                                        fontSize={11} 
                                                        tickLine={false} 
                                                        interval={0}
                                                        angle={-20}
                                                        textAnchor="end"
                                                    />
                                                    <YAxis 
                                                        stroke="#64748b" 
                                                        fontSize={11} 
                                                        tickLine={false} 
                                                        allowDecimals={false}
                                                    />
                                                    <Tooltip content={<CustomBarTooltip />} />
                                                    <Bar 
                                                        dataKey="موجودی_کل" 
                                                        fill="#6366f1" 
                                                        radius={[8, 8, 0, 0]}
                                                    >
                                                        {chartFrequencyData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={entry.موجودی_کل === 1 ? '#f59e0b' : COLORS[index % COLORS.length]} 
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                        <div className="h-64 w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartPieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={85}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                    >
                                                        {chartPieData.map((entry, index) => (
                                                            <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(val: any, name: any) => [`${Number(val).toLocaleString('fa-IR')} دستگاه/فقره`, name]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Pie Legend & Share Breakdown */}
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-black text-slate-300 mb-2">سهم هر مدل از کل ناوگان عرضه:</h4>
                                            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                                                {chartPieData.map((item, idx) => (
                                                    <div 
                                                        key={item.name} 
                                                        onClick={() => setRadarSearchTerm(item.name === 'سایر مدل‌ها' ? '' : item.name)}
                                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer text-xs"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span 
                                                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                            ></span>
                                                            <span className="font-bold text-slate-200 truncate max-w-[140px]">{item.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 font-mono">
                                                            <span className="text-slate-400 text-[11px]">{item.value.toLocaleString('fa-IR')} عدد</span>
                                                            <span className="font-black text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded text-[10px]">
                                                                {item.percent}٪
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* UNIFIED FAST-ACTION INVENTORY WORKSPACE (جدول اقدام و رصد یکپارچه کل موجودی) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>میز مدیریت و اقدام سریع کل موجودی (انبار، نمایشگاه، حواله)</span>
                            <span className="text-xs font-bold text-slate-400 font-mono">({radarTableConditions.length.toLocaleString('fa-IR')} ردیف)</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            امکان ویرایش آنی موجودی، تغییر وضعیت، و مشاهده مشخصات کامل خودروها به صورت یکپارچه
                        </p>
                    </div>

                    {/* Fast Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setRadarStockFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                radarStockFilter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            همه
                        </button>
                        <button
                            onClick={() => setRadarStockFilter('high_stock')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                                radarStockFilter === 'high_stock'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                            }`}
                        >
                            <Flame className="w-3 h-3" />
                            <span>پرموجودی‌ها</span>
                        </button>
                        <button
                            onClick={() => setRadarStockFilter('single_unit')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                                radarStockFilter === 'single_unit'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                            }`}
                        >
                            <Zap className="w-3 h-3" />
                            <span>تک‌موجودها</span>
                        </button>
                        <button
                            onClick={() => setRadarStockFilter('out_of_stock')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                                radarStockFilter === 'out_of_stock'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            <AlertCircle className="w-3 h-3" />
                            <span>ناموجودها</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text"
                            value={radarSearchTerm}
                            onChange={e => setRadarSearchTerm(e.target.value)}
                            placeholder="جستجو در نام مدل، توضیحات، رنگ و ..."
                            className="w-full pr-10 pl-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                        {radarSearchTerm && (
                            <button onClick={() => setRadarSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-slate-100/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                                <th className="p-3.5">کانال و خودرو</th>
                                <th className="p-3.5 text-center">تعداد موجودی</th>
                                <th className="p-3.5">نوع عرضه و پرداخت</th>
                                <th className="p-3.5">مبلغ ودیعه / قیمت</th>
                                <th className="p-3.5">موعد تحویل</th>
                                <th className="p-3.5 text-center">وضعیت فروش</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {radarTableConditions.map(condition => {
                                const isSingle = condition.stock_quantity === 1 && condition.status === ConditionStatus.AVAILABLE;
                                const isHigh = (condition.stock_quantity || 0) >= 3 && condition.status === ConditionStatus.AVAILABLE;
                                const isSold = condition.status === ConditionStatus.SOLD_OUT || condition.stock_quantity === 0;

                                return (
                                    <tr key={condition.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                                        {/* Car Model & Origin */}
                                        <td className="p-3.5">
                                            <div className="space-y-1">
                                                <div className="font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                    <span>{condition.car_model}</span>
                                                    {condition.model && (
                                                        <span className="text-[10px] text-slate-400 font-mono">({condition.model})</span>
                                                    )}
                                                    {/* Single unit badge */}
                                                    {isSingle && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/40">
                                                            ⚡ آخرین دستگاه
                                                        </span>
                                                    )}
                                                    {/* High stock badge */}
                                                    {isHigh && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/40">
                                                            🔥 اولویت فروش
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                                                        condition.sale_type === SaleType.TRANSFER 
                                                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                                            : condition.sale_type === SaleType.USED
                                                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                                            : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                    }`}>
                                                        {condition.sale_type === SaleType.TRANSFER ? '🎫 حواله' : condition.sale_type === SaleType.USED ? '🚗 کارکرده' : '🏢 انبار/نمایشگاه'}
                                                    </span>
                                                    {condition.colors && <span className="truncate max-w-[150px]">🎨 {condition.colors}</span>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Stock Quantity Controls */}
                                        <td className="p-3.5 text-center">
                                            <div className="inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => onStockChange && onStockChange(condition, 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm cursor-pointer"
                                                    title="افزایش ۱ دستگاه"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={condition.stock_quantity ?? 0}
                                                    onChange={e => onDirectStockChange && onDirectStockChange(condition, e.target.value)}
                                                    className="w-12 text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black font-mono text-sm py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
                                                />

                                                <button
                                                    onClick={() => onStockChange && onStockChange(condition, -1)}
                                                    disabled={condition.stock_quantity <= 0}
                                                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                                                    title="کاهش ۱ دستگاه"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Sale & Payment Type */}
                                        <td className="p-3.5">
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                                    {condition.sale_type}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-bold">
                                                    {condition.pay_type}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Deposit / Price */}
                                        <td className="p-3.5 font-mono">
                                            <div className="space-y-0.5">
                                                {condition.initial_deposit ? (
                                                    <div className="font-black text-indigo-600 dark:text-indigo-400 text-xs">
                                                        {condition.initial_deposit.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">تومان</span>
                                                    </div>
                                                ) : condition.car_price ? (
                                                    <div className="font-black text-slate-800 dark:text-slate-200 text-xs">
                                                        {condition.car_price.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">تومان</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-[10px]">استعلام قیمت</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Delivery timeline */}
                                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-bold">
                                            {condition.delivery_time || 'فوری / طبق بخشنامه'}
                                        </td>

                                        {/* Status selector */}
                                        <td className="p-3.5 text-center">
                                            <select
                                                value={condition.status}
                                                onChange={e => onStatusChange && onStatusChange(condition, e.target.value as ConditionStatus)}
                                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black outline-none border cursor-pointer ${
                                                    condition.status === ConditionStatus.AVAILABLE
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                                        : condition.status === ConditionStatus.CAPACITY_FULL
                                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                                }`}
                                            >
                                                <option value={ConditionStatus.AVAILABLE}>🟢 آماده واگذاری</option>
                                                <option value={ConditionStatus.CAPACITY_FULL}>🟡 تکمیل ظرفیت</option>
                                                <option value={ConditionStatus.SOLD_OUT}>🔴 فروخته شد / اتمام</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                            {radarTableConditions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                                        موردی با شرایط و فیلترهای مدنظر یافت نشد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: EXECUTIVE MANAGEMENT REPORT (گزارش مدیریتی) */}
            <ExecutiveReportModal
                isOpen={isManagerReportModalOpen}
                onClose={() => setIsManagerReportModalOpen(false)}
                conditions={scopedConditions}
                allCarsCatalog={allCarsCatalog}
                totals={totals}
                modelStockStats={modelStockStats}
                highStockModels={highStockModels}
                singleUnitModels={singleUnitModels}
                outOfStockInfo={outOfStockInfo}
                selectedSaleTypes={selectedSaleTypes}
                selectedPayTypes={selectedPayTypes}
                selectedModelYears={selectedModelYears}
                availableSaleTypes={availableSaleTypes}
                availablePayTypes={availablePayTypes}
                availableModelYears={availableModelYears}
                onToggleSaleType={toggleSaleType}
                onTogglePayType={togglePayType}
                onToggleModelYear={toggleModelYear}
                onClearFilters={clearMultiFilters}
                showToast={showToast}
            />

            {/* MODAL 2: SALES SPECIALISTS BRIEFING & TARGETS (ابلاغیه کارشناسان فروش) */}
            <SalesSpecialistsBriefingModal
                isOpen={isSpecialistsBriefModalOpen}
                onClose={() => setIsSpecialistsBriefModalOpen(false)}
                conditions={scopedConditions}
                highStockModels={highStockModels}
                singleUnitModels={singleUnitModels}
                outOfStockInfo={outOfStockInfo}
                selectedSaleTypes={selectedSaleTypes}
                selectedPayTypes={selectedPayTypes}
                selectedModelYears={selectedModelYears}
                availableSaleTypes={availableSaleTypes}
                availablePayTypes={availablePayTypes}
                availableModelYears={availableModelYears}
                onToggleSaleType={toggleSaleType}
                onTogglePayType={togglePayType}
                onToggleModelYear={toggleModelYear}
                onClearFilters={clearMultiFilters}
                showToast={showToast}
            />
        </div>
    );
};

/* =========================================================================
   SUB-COMPONENT: EXECUTIVE REPORT MODAL (گزارش راهبردی مدیریت)
   ========================================================================= */
interface ExecutiveReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    conditions: CarSaleCondition[];
    allCarsCatalog: Car[];
    totals: {
        totalUnits: number;
        warehouseUnits: number;
        transferUnits: number;
        estimatedCapitalDeposit: number;
    };
    modelStockStats: any[];
    highStockModels: any[];
    singleUnitModels: any[];
    outOfStockInfo: any;
    selectedSaleTypes?: string[];
    selectedPayTypes?: string[];
    selectedModelYears?: string[];
    availableSaleTypes?: string[];
    availablePayTypes?: string[];
    availableModelYears?: string[];
    onToggleSaleType?: (type: string) => void;
    onTogglePayType?: (type: string) => void;
    onToggleModelYear?: (year: string) => void;
    onClearFilters?: () => void;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
    isOpen,
    onClose,
    conditions,
    totals,
    modelStockStats,
    highStockModels,
    singleUnitModels,
    outOfStockInfo,
    selectedSaleTypes = [],
    selectedPayTypes = [],
    selectedModelYears = [],
    availableSaleTypes = [],
    availablePayTypes = [],
    availableModelYears = [],
    onToggleSaleType,
    onTogglePayType,
    onToggleModelYear,
    onClearFilters,
    showToast
}) => {
    const [copied, setCopied] = useState<boolean>(false);

    const nowStr = useMemo(() => {
        const now = new Date();
        const d = now.toLocaleDateString('fa-IR');
        const t = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        return { date: d, time: t };
    }, []);

    // Generate Formatted Plain Text Report for Instant Copy
    const textReport = useMemo(() => {
        let text = `📊 گزارش راهبردی و تحلیلی موجودی ناوگان (مدیریت فروش)\n`;
        text += `🏢 نمایندگی ۲۶۰۶ کرمان موتور\n`;
        text += `📅 تاریخ تهیه: ${nowStr.date} - ساعت: ${nowStr.time}\n`;

        if (selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) {
            text += `🔍 فیلترهای اعمال‌شده بر گزارش:\n`;
            if (selectedSaleTypes.length > 0) {
                text += `  • نوع عرضه: ${selectedSaleTypes.join('، ')}\n`;
            }
            if (selectedPayTypes.length > 0) {
                text += `  • روش پرداخت: ${selectedPayTypes.join('، ')}\n`;
            }
            if (selectedModelYears.length > 0) {
                text += `  • سال ساخت: ${selectedModelYears.join('، ')}\n`;
            }
        } else {
            text += `🔍 دامنه گزارش: جامع (کلیه انواع عرضه، روش‌های پرداخت و سال‌های ساخت)\n`;
        }

        text += `═══════════════════════════════════════\n\n`;

        text += `۱️⃣ آمار تجمیعی ناوگان در این محدوده:\n`;
        text += `• کل ظرفیت واگذاری: ${totals.totalUnits.toLocaleString('fa-IR')} دستگاه/فقره\n`;
        text += `• موجودی فیزیکی انبار و نمایشگاه: ${totals.warehouseUnits.toLocaleString('fa-IR')} دستگاه\n`;
        text += `• حواله‌ها و کاردکس‌های آماده انتقال: ${totals.transferUnits.toLocaleString('fa-IR')} فقره\n`;
        if (totals.estimatedCapitalDeposit > 0) {
            const inMilliards = (totals.estimatedCapitalDeposit / 1_000_000_000).toFixed(1);
            text += `• برآورد ودیعه در گردش: ${Number(inMilliards).toLocaleString('fa-IR')} میلیارد تومان\n`;
        }
        text += `\n`;

        text += `۲️⃣ اولویت‌های ۱ فروش (انباشت موجودی و خواب سرمایه):\n`;
        if (highStockModels.length > 0) {
            highStockModels.forEach((m, idx) => {
                text += `  ${idx + 1}. ${m.modelName} ⬅️ موجودی: ${m.totalStock.toLocaleString('fa-IR')} دستگاه (انبار: ${m.warehouseStock} | حواله: ${m.transferStock})\n`;
            });
        } else {
            text += `  موردی با انباشت موجودی بحرانی ثبت نشده است.\n`;
        }
        text += `\n`;

        text += `۳️⃣ فرصت‌های بستن سریع معامله (تک‌دستگاه‌ها):\n`;
        if (singleUnitModels.length > 0) {
            singleUnitModels.forEach((m, idx) => {
                text += `  ${idx + 1}. ${m.modelName} ⚡ (فقط ۱ دستگاه باقی‌مانده)\n`;
            });
        } else {
            text += `  خودروی تک‌موجود در این فیلتر نداریم.\n`;
        }
        text += `\n`;

        text += `۴️⃣ وضعیت کسری و اتمام ظرفیت:\n`;
        text += `• تعداد مدل‌های ناموجود / پایان یافته: ${outOfStockInfo.totalUnavailableCount.toLocaleString('fa-IR')} مورد\n`;
        outOfStockInfo.soldOutConditions.slice(0, 5).forEach((c: any) => {
            text += `  - ${c.car_model} (${c.sale_type} - ${c.pay_type}) [اتمام موجودی]\n`;
        });
        text += `\n`;

        text += `۵️⃣ توصیه‌های مدیریتی و اقدامات پیشنهادی:\n`;
        text += `• تمرکز کمپین‌های تبلیغاتی و پورسانت تشویقی روی: ${highStockModels.slice(0, 3).map(m => m.modelName).join('، ') || 'خودروهای جاری'}\n`;
        text += `• تعیین تکلیف فوری تک‌دستگاه‌ها برای صفر کردن خواب اقلام تک‌مانده.\n`;
        text += `• بررسی بازار جهت تأمین یا جایگزینی خودروهای دارای تقاضا ولی ناموجود.\n\n`;

        text += `═══════════════════════════════════════\n`;
        text += `امضای مدیر فروش: ___________________\n`;

        return text;
    }, [nowStr, totals, highStockModels, singleUnitModels, outOfStockInfo, selectedSaleTypes, selectedPayTypes]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(textReport);
        setCopied(true);
        if (showToast) showToast('گزارش مدیریتی در کلیپ‌بورد کپی شد.', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Executive-Report-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 lg:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">
                                گزارش جامع راهبردی و تحلیلی موجودی مدیریت
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">
                                تاریخ گزارش: {nowStr.date} - ساعت: {nowStr.time} | نمایندگی ۲۶۰۶
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Filter Pills Quick Scope Banner */}
                {(selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) && (
                    <div className="px-6 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-black">فیلترهای فعال روی گزارش:</span>
                            {selectedSaleTypes.map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[11px] font-black border border-sky-300 dark:border-sky-700">
                                    🏷️ {t}
                                </span>
                            ))}
                            {selectedPayTypes.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-700">
                                    💳 {p}
                                </span>
                            ))}
                            {selectedModelYears.map(y => (
                                <span key={y} className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700">
                                    📅 {y}
                                </span>
                            ))}
                        </div>
                        {onClearFilters && (
                            <button 
                                onClick={onClearFilters}
                                className="text-[11px] text-rose-500 hover:text-rose-600 font-black cursor-pointer"
                            >
                                حذف فیلترها و گزارش جامع
                            </button>
                        )}
                    </div>
                )}

                {/* Report Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Executive Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                            <span className="text-[11px] font-black text-slate-400 block mb-1">ظرفیت واگذاری فیلترشده</span>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                {totals.totalUnits.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">دستگاه</span>
                            </div>
                            <span className="text-[10px] text-slate-400">انبار: {totals.warehouseUnits} | حواله: {totals.transferUnits}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                            <span className="text-[11px] font-black text-rose-500 block mb-1">خودروهای اولویت ۱ (انباشت)</span>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                                {highStockModels.length.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">مدل</span>
                            </div>
                            <span className="text-[10px] text-slate-400">مجموع {highStockModels.reduce((acc, m) => acc + m.totalStock, 0)} دستگاه نیازمند شتاب فروش</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                            <span className="text-[11px] font-black text-amber-500 block mb-1">تک‌دستگاه‌های آماده تحویل</span>
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                                {singleUnitModels.length.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">دستگاه</span>
                            </div>
                            <span className="text-[10px] text-slate-400">فرصت بستن فوری معامله</span>
                        </div>
                    </div>

                    {/* Section 1: Detailed Table of High Stock Models */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>جدول تحلیلی خودروهای با بالاترین موجودی (اولویت‌های تخلیه انبار):</span>
                        </h4>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                    <tr>
                                        <th className="p-3">ردیف</th>
                                        <th className="p-3">مدل خودرو</th>
                                        <th className="p-3 text-center">موجودی انبار</th>
                                        <th className="p-3 text-center">تعداد حواله</th>
                                        <th className="p-3 text-center">مجموع</th>
                                        <th className="p-3">دامنه ودیعه / قیمت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {highStockModels.map((m, idx) => (
                                        <tr key={m.modelName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-3 font-mono">{idx + 1}</td>
                                            <td className="p-3 font-black text-slate-800 dark:text-slate-200">{m.modelName}</td>
                                            <td className="p-3 text-center font-mono">{m.warehouseStock.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 text-center font-mono">{m.transferStock.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{m.totalStock.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 font-mono text-[11px] text-slate-500">
                                                {m.minDeposit ? `${m.minDeposit.toLocaleString('fa-IR')} تومان` : 'طبق بخشنامه'}
                                            </td>
                                        </tr>
                                    ))}
                                    {highStockModels.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-slate-400 font-bold">
                                                موردی با انباشت موجودی در این فیلتر ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Formatted Text Preview */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            متن خام گزارش استاندارد (آماده ارسال و آرشیو):
                        </label>
                        <textarea
                            readOnly
                            value={textReport}
                            rows={8}
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 leading-relaxed outline-none"
                            dir="rtl"
                        />
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'کپی شد!' : 'کپی متن گزارش'}</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>دانلود فایل متنی</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>چاپ گزارش</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};

/* =========================================================================
   SUB-COMPONENT: SALES SPECIALISTS BRIEFING MODAL (ابلاغیه و تارگت کارشناسان)
   ========================================================================= */
interface SalesSpecialistsBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    conditions: CarSaleCondition[];
    highStockModels: any[];
    singleUnitModels: any[];
    outOfStockInfo: any;
    selectedSaleTypes?: string[];
    selectedPayTypes?: string[];
    selectedModelYears?: string[];
    availableSaleTypes?: string[];
    availablePayTypes?: string[];
    availableModelYears?: string[];
    onToggleSaleType?: (type: string) => void;
    onTogglePayType?: (type: string) => void;
    onToggleModelYear?: (year: string) => void;
    onClearFilters?: () => void;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

const SalesSpecialistsBriefingModal: React.FC<SalesSpecialistsBriefingModalProps> = ({
    isOpen,
    onClose,
    highStockModels,
    singleUnitModels,
    outOfStockInfo,
    selectedSaleTypes = [],
    selectedPayTypes = [],
    selectedModelYears = [],
    availableSaleTypes = [],
    availablePayTypes = [],
    availableModelYears = [],
    onToggleSaleType,
    onTogglePayType,
    onToggleModelYear,
    onClearFilters,
    showToast
}) => {
    const [managerNote, setManagerNote] = useState<string>(
        'همکاران گرامی واحد فروش، در مذاکرات و مشاوره‌های امروز اولویت اول جذب مشتری برای مدل‌های پرموجودی و تعیین تکلیف فوری تک‌دستگاه‌ها می‌باشد.'
    );
    const [footerText, setFooterText] = useState<string>(DEFAULT_DEALERSHIP_FOOTER);
    const [copied, setCopied] = useState<boolean>(false);

    const nowStr = useMemo(() => {
        const now = new Date();
        const d = now.toLocaleDateString('fa-IR');
        const t = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        return { date: d, time: t };
    }, []);

    // Generate Formatted Telegram / WhatsApp Briefing
    const formattedBriefingText = useMemo(() => {
        let text = `📢 ابلاغیه و اهداف فروش روزانه (تیم فروش)\n`;
        text += `🏢 نمایندگی ۲۶۰۶ کرمان موتور\n`;
        text += `📅 تاریخ: ${nowStr.date} - ساعت: ${nowStr.time}\n`;

        if (selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) {
            text += `🎯 محدوده تارگت ابلاغیه: `;
            const parts: string[] = [];
            if (selectedSaleTypes.length > 0) parts.push(`عرضه: ${selectedSaleTypes.join('، ')}`);
            if (selectedPayTypes.length > 0) parts.push(`پرداخت: ${selectedPayTypes.join('، ')}`);
            if (selectedModelYears.length > 0) parts.push(`سال ساخت: ${selectedModelYears.join('، ')}`);
            text += `${parts.join(' | ')}\n`;
        }

        text += `\n`;

        if (managerNote.trim()) {
            text += `📌 پیام و دستور کار مدیر فروش:\n`;
            text += `«${managerNote.trim()}»\n\n`;
        }

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🔥 اولویت شماره ۱: تمرکز فروش (انباشت موجودی و شرایط ویژه):\n`;
        if (highStockModels.length > 0) {
            highStockModels.forEach((m, idx) => {
                text += `🔹 ${idx + 1}. ${m.modelName}\n`;
                text += `   • تعداد در دسترس: ${m.totalStock.toLocaleString('fa-IR')} دستگاه\n`;
                if (m.conditions[0]?.delivery_time) {
                    text += `   • تحویل: ${m.conditions[0].delivery_time}\n`;
                }
                if (m.minDeposit) {
                    text += `   • پیش‌پرداخت/ودیعه: ${m.minDeposit.toLocaleString('fa-IR')} تومان\n`;
                }
                text += `\n`;
            });
        } else {
            text += `موجودی عادی است.\n\n`;
        }

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚡ اولویت شماره ۲: آخرین شانس خرید (تک‌دستگاه‌های آماده تحویل):\n`;
        if (singleUnitModels.length > 0) {
            singleUnitModels.forEach((m, idx) => {
                text += `🔸 ${idx + 1}. ${m.modelName} ⚡[فقط ۱ دستگاه/بستن فوری]\n`;
            });
            text += `(نکته پرزنت: به مشتریان اعلام کنید تنها ۱ دستگاه با این شرایط باقی مانده است)\n\n`;
        } else {
            text += `خودروی تک‌موجود وجود ندارد.\n\n`;
        }

        if (outOfStockInfo.soldOutConditions.length > 0) {
            text += `━━━━━━━━━━━━━━━━━━━━━\n`;
            text += `🚫 وضعیت خودروهای ناموجود (هدایت به جایگزین):\n`;
            outOfStockInfo.soldOutConditions.slice(0, 4).forEach((c: any) => {
                text += `• ${c.car_model} (${c.sale_type}) ⬅️ اتمام ظرفیت (پیشنهاد مدل‌های مشابه)\n`;
            });
            text += `\n`;
        }

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `${footerText}\n`;

        return text;
    }, [nowStr, managerNote, highStockModels, singleUnitModels, outOfStockInfo, footerText, selectedSaleTypes, selectedPayTypes, selectedModelYears]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedBriefingText);
        setCopied(true);
        if (showToast) showToast('ابلاغیه فروش در کلیپ‌بورد کپی شد (آماده ارسال در گروه فروش)', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 lg:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Send className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">
                                ابلاغیه روزانه و اهداف کارشناسان فروش
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">
                                قالب آماده جهت ارسال در گروه‌های واتساپ، تلگرام و بله کارشناسان نمایندگی
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Filter Scope Tag Banner */}
                {(selectedSaleTypes.length > 0 || selectedPayTypes.length > 0 || selectedModelYears.length > 0) && (
                    <div className="px-6 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-black">هدف‌گذاری بر اساس فیلترهای:</span>
                            {selectedSaleTypes.map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[11px] font-black border border-sky-300 dark:border-sky-700">
                                    🏷️ {t}
                                </span>
                            ))}
                            {selectedPayTypes.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-700">
                                    💳 {p}
                                </span>
                            ))}
                            {selectedModelYears.map(y => (
                                <span key={y} className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700">
                                    📅 {y}
                                </span>
                            ))}
                        </div>
                        {onClearFilters && (
                            <button onClick={onClearFilters} className="text-[11px] text-rose-500 hover:text-rose-600 font-black cursor-pointer">
                                حذف همه فیلترها
                            </button>
                        )}
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Customizable Manager Note */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            پیام و دستور کار مدیر فروش برای کارشناسان:
                        </label>
                        <textarea
                            value={managerNote}
                            onChange={e => setManagerNote(e.target.value)}
                            rows={3}
                            placeholder="متن دستور کار یا انگیزه روزانه برای تیم فروش..."
                            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Formatted Text Preview */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            پیش‌نمایش متن نهایی ابلاغیه (فرمت‌شده برای پیام‌رسان‌ها):
                        </label>
                        <textarea
                            readOnly
                            value={formattedBriefingText}
                            rows={10}
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 leading-relaxed outline-none"
                            dir="rtl"
                        />
                    </div>

                    {/* Footer signature edit */}
                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500">
                            پاورقی و اطلاعات تماس نمایندگی:
                        </label>
                        <textarea
                            value={footerText}
                            onChange={e => setFooterText(e.target.value)}
                            rows={4}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <button
                        onClick={handleCopy}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-950/30 transition-all cursor-pointer"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'کپی شد!' : 'کپی متن برای ارسال به کارشناسان 📲'}</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};
