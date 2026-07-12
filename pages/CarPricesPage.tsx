
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getScrapedCarPrices, getScrapedCarPriceSources, getCarPriceStats, addCustomPrice } from '../services/api';
import type { ScrapedCarPrice, CarPriceSource, CarPriceStats } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { SortIcon } from '../components/icons/SortIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import CarPriceCopySettingsModal from '../components/CarPriceCopySettingsModal';
import AddCustomPriceModal from '../components/AddCustomPriceModal';
import { Plus, Clock, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';

const timeAgo = (dateString: string): string => {
    try {
        // API returns UTC in 'YYYY-MM-DD HH:MM:SS' format.
        // We parse it manually as UTC to avoid browser inconsistencies with `new Date(string)`.
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return dateString;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        // Date.UTC expects month to be 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'همین الان';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');

        const days = Math.floor(hours / 24);
        return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');

    } catch(e) {
        return dateString;
    }
};

const isOlderThan24Hours = (dateString: string): boolean => {
    try {
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return false;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        // Date.UTC expects month to be 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return false;
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs > 24 * 60 * 60 * 1000;
    } catch(e) {
        return false;
    }
};

const isOlderThan3Days = (dateString: string): boolean => {
    try {
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return false;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return false;
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs > 3 * 24 * 60 * 60 * 1000;
    } catch(e) {
        return false;
    }
};

type TableRow = { 
    model_name: string;
    minPrice: number;
    maxPrice: number;
    [source: string]: number | string; 
};

interface CarPricesPageProps {}

const CarPricesPage: React.FC<CarPricesPageProps> = () => {
    const [prices, setPrices] = useState<ScrapedCarPrice[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'model_name', direction: 'ascending' });
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Auto Refresh State
    const [refreshInterval, setRefreshInterval] = useState<number>(0); // 0 means manual
    const [secondsLeft, setSecondsLeft] = useState<number>(0);

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Copy Modal State
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // Add Custom Price Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    
    // Havaleh Visibility States
    const [showHavalehs, setShowHavalehs] = useState<boolean>(false);
    const [expandedHavalehs, setExpandedHavalehs] = useState<Record<string, boolean>>({});

    const toggleHavalehExpanded = (modelName: string) => {
        setExpandedHavalehs(prev => ({
            ...prev,
            [modelName]: prev[modelName] !== undefined ? !prev[modelName] : !showHavalehs
        }));
    };

    const toggleCardExpanded = (modelName: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [modelName]: !prev[modelName]
        }));
    };

    const existingModelsList = useMemo(() => {
        const models = new Set<string>();
        priceStats.forEach(stat => models.add(stat.model_name));
        prices.forEach(p => models.add(p.model_name));
        return Array.from(models).sort();
    }, [priceStats, prices]);

    const handleAddCustomPriceSubmit = async (payload: {
        source_name: 'custom';
        model_name: string;
        price_rial: number;
        price_text: string;
        captured_at: string;
    }) => {
        await addCustomPrice(payload);
        showToast('قیمت دستی خودرو با موفقیت ثبت شد', 'success');
        await fetchAllData();
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pricesData, sourcesData, statsData] = await Promise.all([
                getScrapedCarPrices(),
                getScrapedCarPriceSources(),
                getCarPriceStats()
            ]);
            
            const filteredPrices = pricesData.filter(price => {
                if (price.source_name === 'custom') {
                    return !isOlderThan24Hours(price.captured_at);
                }
                return !isOlderThan3Days(price.captured_at);
            });

            const latestPrices = new Map<string, ScrapedCarPrice>();
            filteredPrices.forEach(price => {
                const key = `${price.model_name}-${price.source_name}`;
                const existing = latestPrices.get(key);
                const priceDate = new Date(price.captured_at.replace(' ', 'T') + 'Z');
                if (!existing || priceDate > new Date(existing.captured_at.replace(' ', 'T') + 'Z')) {
                    latestPrices.set(key, price);
                }
            });

            const uniquePrices = Array.from(latestPrices.values());
            setPrices(uniquePrices);
            
            const customExists = uniquePrices.some(p => p.source_name === 'custom');
            const sourceNamesList = sourcesData.map((s: CarPriceSource) => s.source_name);
            if (customExists && !sourceNamesList.includes('custom')) {
                sourceNamesList.push('custom');
            }
            setSources(sourceNamesList.sort());
            
            const filteredStats = statsData.filter(stat => {
                const hasActiveCustom = uniquePrices.some(p => p.model_name === stat.model_name && p.source_name === 'custom');
                if (hasActiveCustom) return true;
                return !isOlderThan3Days(stat.computed_at);
            });
            setPriceStats(filteredStats.sort((a, b) => b.maximum - a.maximum));

            if (uniquePrices.length > 0) {
                 const mostRecentDateString = uniquePrices.reduce((latest, current) => {
                    const latestDate = new Date(latest.captured_at.replace(' ', 'T') + 'Z');
                    const currentDate = new Date(current.captured_at.replace(' ', 'T') + 'Z');
                    return currentDate > latestDate ? current : latest;
                }).captured_at;
                
                setLastUpdated(mostRecentDateString);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const handleRefresh = () => {
            fetchAllData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, [fetchAllData]);

    // Effect for the auto refresh timer
    useEffect(() => {
        if (refreshInterval <= 0) {
            setSecondsLeft(0);
            return;
        }

        setSecondsLeft(refreshInterval * 60);

        const intervalId = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    fetchAllData();
                    return refreshInterval * 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [refreshInterval, fetchAllData]);

    const tableData = useMemo((): TableRow[] => {
        const groupedByModel = prices.reduce((acc, price) => {
            if (!acc[price.model_name]) {
                acc[price.model_name] = {};
            }
            acc[price.model_name][price.source_name] = price.price_rial;
            return acc;
        }, {} as Record<string, Record<string, number>>);

        return Object.entries(groupedByModel).map(([model_name, sourcePrices]) => {
            const numericPrices = Object.values(sourcePrices).filter(p => p > 0);
            
            const row: Partial<TableRow> = { 
                model_name,
                minPrice: numericPrices.length > 0 ? Math.min(...numericPrices) : 0,
                maxPrice: numericPrices.length > 0 ? Math.max(...numericPrices) : 0,
            };

            sources.forEach(source => {
                row[source] = sourcePrices[source] ?? 0;
            });
            return row as TableRow;
        });
    }, [prices, sources]);

    const sortedTableData = useMemo(() => {
        if (!sortConfig.key) return tableData;

        return [...tableData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (aValue === 0 && bValue > 0) return 1;
                if (bValue === 0 && aValue > 0) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }
            
            const aStr = String(aValue);
            const bStr = String(bValue);

            const comparison = aStr.localeCompare(bStr, 'fa-IR');
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [tableData, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const handleCopyStatsClick = () => {
        if (priceStats.length === 0) {
            showToast('آماری برای کپی کردن وجود ندارد', 'error');
            return;
        }
        setIsCopyModalOpen(true);
    };

    const SortableHeader: React.FC<{ title: string; sortKey: string; className?: string }> = ({ title, sortKey, className='' }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className={`px-4 py-3 sticky top-0 bg-slate-100 z-10 ${className}`}>
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group whitespace-nowrap"
                    onClick={() => handleSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    const priceStatsWithOverride = useMemo(() => {
        // First map existing stats
        const overridden = priceStats.map(stat => {
            const manualPrice = prices.find(p => p.model_name === stat.model_name && p.source_name === 'custom');
            const lowestLimit = (manualPrice ? manualPrice.price_rial : (stat.minimum && stat.minimum > 0 ? stat.minimum : stat.maximum)) * 0.98;
            if (manualPrice) {
                return {
                    ...stat,
                    maximum: manualPrice.price_rial,
                    lowestLimit,
                };
            }
            return {
                ...stat,
                lowestLimit,
            };
        });

        // Search for manual prices of models NOT in priceStats yet
        const existingModelNames = new Set(priceStats.map(s => s.model_name));
        let syntheticId = priceStats.length + 1000;
        
        prices.forEach(price => {
            if (price.source_name === 'custom' && !existingModelNames.has(price.model_name)) {
                overridden.push({
                    id: syntheticId++,
                    model_name: price.model_name,
                    minimum: price.price_rial,
                    maximum: price.price_rial,
                    average: price.price_rial,
                    computed_at: price.captured_at,
                    lowestLimit: price.price_rial * 0.98
                });
                existingModelNames.add(price.model_name);
            }
        });

        return overridden;
    }, [priceStats, prices]);

    const renderPriceStats = () => (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
                 <div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">آمار خلاصه قیمت‌ها</h2>
                    {lastUpdated && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">آخرین بروزرسانی: {timeAgo(lastUpdated)}</p>}
                 </div>
                 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Global Havaleh Toggle */}
                    <label className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showHavalehs}
                            onChange={(e) => setShowHavalehs(e.target.checked)}
                            className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300">نمایش حواله‌ها</span>
                    </label>

                    {/* Auto Refresh Select */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">بروزرسانی خودکار:</span>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer"
                        >
                            <option value={0} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">دستی</option>
                            <option value={5} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۵ دقیقه</option>
                            <option value={10} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱۰ دقیقه</option>
                            <option value={15} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱۵ دقیقه</option>
                            <option value={30} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۳۰ دقیقه</option>
                            <option value={60} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱ ساعت</option>
                        </select>
                        {refreshInterval > 0 && (
                            <span className="text-slate-500 dark:text-slate-400 font-mono font-bold mr-1 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                {formatTimeLeft(secondsLeft)}
                             </span>
                        )}
                    </div>

                    <button 
                        onClick={fetchAllData}
                        disabled={loading}
                        className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        title="بروزرسانی دستی"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        ثبت دستی قیمت
                    </button>
                    <button 
                        onClick={handleCopyStatsClick}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        disabled={loading || !!error || priceStatsWithOverride.length === 0}
                    >
                        <CopyIcon />
                        کپی آمار
                    </button>
                 </div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                * کمترین نرخ معامله (کف) برابر با کمترین قیمت منبع - ۲٪ و بیشترین نرخ معامله (سقف) برابر با بیشترین قیمت منبع + ۲٪ است. قیمت‌های دستی دارای بالاترین اولویت می‌باشند.
             </p>
            {loading ? (
                <div className="flex justify-center items-center h-40 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {priceStatsWithOverride.map(stat => {
                        const manualPrice = prices.find(p => p.model_name === stat.model_name && p.source_name === 'custom');
                        const otherPrices = prices.filter(p => p.model_name === stat.model_name && p.source_name !== 'custom' && p.price_rial > 0);
                        
                        // Change: Highest limit is now +2% instead of +7%
                        const highestLimit = stat.maximum * 1.02;
                        
                        // Lowest limit is based on lowest source (or manual price if overridden)
                        const lowestLimit = (manualPrice ? manualPrice.price_rial : (stat.minimum && stat.minimum > 0 ? stat.minimum : stat.maximum)) * 0.98;
                        
                        // Havaleh Calculations
                        // 1 Month: Max - 5% (Min), Max - 3% (Max)
                        const havaleh1Min = stat.maximum * 0.95; 
                        const havaleh1Max = stat.maximum * 0.97;

                        // 2 Month: Max - 10% (Min), Max - 6% (Max)
                        const havaleh2Min = stat.maximum * 0.90;
                        const havaleh2Max = stat.maximum * 0.94;

                        return (
                        <div key={stat.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border ${manualPrice ? 'border-sky-300 dark:border-sky-700 ring-2 ring-sky-100 dark:ring-sky-950/20' : 'border-slate-100 dark:border-slate-700'} flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}>
                            {manualPrice && (
                                <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg flex items-center gap-1.5 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    قیمت دستی مصوب
                                </div>
                            )}
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-lg mb-4 truncate pr-16">{stat.model_name}</h3>
                                <div className="space-y-4 text-sm">
                                    
                                    {/* Base Price */}
                                    <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                                        {manualPrice ? (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sky-600 dark:text-sky-400 font-bold text-xs">قیمت دستی اصلی:</span>
                                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {timeAgo(manualPrice.captured_at)}
                                                    </span>
                                                </div>
                                                <div className="bg-sky-50/50 dark:bg-sky-950/20 p-2.5 rounded-xl border border-sky-100/40 dark:border-sky-900/30 flex flex-col">
                                                    <span className="font-mono font-black text-sky-700 dark:text-sky-300 text-2xl">
                                                        {manualPrice.price_rial.toLocaleString('fa-IR')} <span className="text-xs font-bold font-sans">تومان</span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                                                        {manualPrice.price_text}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                                    قیمت:
                                                    {isOlderThan24Hours(stat.computed_at) && (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="بیش از ۲۴ ساعت از آخرین بروزرسانی گذشته است" />
                                                    )}
                                                </span>
                                                <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-lg">
                                                    {stat.maximum.toLocaleString('fa-IR')} <span className="text-[10px] font-bold font-sans">تومان</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Havaleh Section Toggle */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleHavalehExpanded(stat.model_name)}
                                            className="w-full flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 rounded-lg text-slate-600 dark:text-slate-300 font-bold transition-all outline-none"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>محاسبات حواله (۱ و ۲ ماهه)</span>
                                            </span>
                                            {(expandedHavalehs[stat.model_name] !== undefined ? expandedHavalehs[stat.model_name] : showHavalehs) ? (
                                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </button>
                                        
                                        {(expandedHavalehs[stat.model_name] !== undefined ? expandedHavalehs[stat.model_name] : showHavalehs) && (
                                            <div className="mt-2 space-y-2 animate-fadeIn">
                                                {/* Havaleh 1 Month */}
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">حواله ۱ ماهه</span>
                                                        <span className="text-[10px] text-emerald-600/70 font-mono">(۳٪ - ۵٪)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center font-mono text-sm text-emerald-900 dark:text-emerald-100 font-bold">
                                                        <span>{Math.round(havaleh1Min).toLocaleString('fa-IR')}</span>
                                                        <span className="text-[10px] text-emerald-400 mx-1 font-sans">تا</span>
                                                        <span>{Math.round(havaleh1Max).toLocaleString('fa-IR')}</span>
                                                    </div>
                                                </div>

                                                {/* Havaleh 2 Month */}
                                                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-800">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">حواله ۲ ماهه</span>
                                                        <span className="text-[10px] text-cyan-600/70 font-mono">(۶٪ - ۱۰٪)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center font-mono text-sm text-cyan-900 dark:text-cyan-100 font-bold">
                                                        <span>{Math.round(havaleh2Min).toLocaleString('fa-IR')}</span>
                                                        <span className="text-[10px] text-cyan-400 mx-1 font-sans">تا</span>
                                                        <span>{Math.round(havaleh2Max).toLocaleString('fa-IR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">کمترین نرخ معامله (کف):</span>
                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{Math.round(lowestLimit).toLocaleString('fa-IR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">بیشترین نرخ معامله (سقف):</span>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Math.round(highestLimit).toLocaleString('fa-IR')}</span>
                                        </div>
                                    </div>

                                    {/* Collapsible Panel for other prices */}
                                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => toggleCardExpanded(stat.model_name)}
                                            className="w-full flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 rounded-lg text-slate-500 dark:text-slate-400 font-semibold transition-all outline-none"
                                        >
                                            <span>مشاهده قیمت سایر مراجع ({otherPrices.length} مرجع)</span>
                                            {expandedCards[stat.model_name] ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                        
                                        {expandedCards[stat.model_name] && (
                                            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                {otherPrices.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-1">مرجع فعال دیگری یافت نشد.</p>
                                                ) : (
                                                    otherPrices.map(op => {
                                                        const isStale = isOlderThan24Hours(op.captured_at);
                                                        return (
                                                            <div key={op.id} className="flex justify-between items-center text-[11px] border-b border-slate-100/50 dark:border-slate-800/50 py-1 last:border-0">
                                                                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                                    {op.source_name}
                                                                    {isStale && (
                                                                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" title="بیش از ۲۴ ساعت از آخرین بروزرسانی گذشته است" />
                                                                    )}
                                                                    :
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-mono font-semibold text-slate-755 dark:text-slate-300">{op.price_rial.toLocaleString('fa-IR')}</span>
                                                                    <span className="text-[10px] text-slate-455 font-normal">({timeAgo(op.captured_at)})</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );

    const renderComparisonTable = () => {
        if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
        if (sortedTableData.length === 0) return <p className="text-center text-slate-500 py-10">هیچ قیمتی یافت نشد.</p>;

        return (
            <div className="overflow-x-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700" style={{maxHeight: '70vh'}}>
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300 border-collapse">
                    <thead className="text-xs text-slate-700 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <SortableHeader title="مدل خودرو" sortKey="model_name" className="sticky left-0 bg-slate-200 dark:bg-slate-900 z-20" />
                            {sources.map(source => (
                                <SortableHeader key={source} title={source} sortKey={source} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                        {sortedTableData.map((row, index) => {
                            const rowBg = index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50';
                            return (
                                <tr key={row.model_name} className={`${rowBg}`}>
                                    <td className={`px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 z-10 border-b border-slate-200 dark:border-slate-700 ${rowBg}`}>
                                        {row.model_name}
                                    </td>
                                    {sources.map(source => {
                                        const price = row[source] as number;
                                        const modelRow = prices.find(p => p.model_name === row.model_name && p.source_name === source);
                                        const isStale = modelRow ? isOlderThan24Hours(modelRow.captured_at) : false;
                                        
                                        let cellClasses = 'px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 font-mono';
                                        
                                        if (price > 0 && row.minPrice !== row.maxPrice) {
                                            if (price === row.minPrice) {
                                                cellClasses += ' bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-bold';
                                            } else if (price === row.maxPrice) {
                                                cellClasses += ' bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 font-bold';
                                            }
                                        }

                                        return (
                                            <td key={source} className={cellClasses}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {price > 0 ? (
                                                        <>
                                                            <span>{price.toLocaleString('fa-IR')}</span>
                                                            {isStale && (
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="بیش از ۲۴ ساعت از آخرین بروزرسانی گذشته است" />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-600">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPriceStats()}
                {renderComparisonTable()}
            </main>
            
            <CarPriceCopySettingsModal 
                isOpen={isCopyModalOpen} 
                onClose={() => setIsCopyModalOpen(false)} 
                stats={priceStatsWithOverride}
                onCopySuccess={() => showToast('آمار با موفقیت کپی شد', 'success')}
            />

            <AddCustomPriceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddCustomPriceSubmit}
                existingModels={existingModelsList}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarPricesPage;
