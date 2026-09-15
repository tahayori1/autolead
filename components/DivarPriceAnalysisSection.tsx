import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, 
    CartesianGrid, Cell, ReferenceLine
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Scale, Sparkles, RefreshCw, Clock, 
    Search, Car, Copy, Check, AlertCircle, ShieldAlert, 
    Info, FileText, Sliders, MapPin, Globe, CheckCircle2, Loader2, X
} from 'lucide-react';
import type { DivarPriceItem, DivarModelStats } from '../types';
import { getDivarPrices } from '../services/api';
import { INITIAL_DIVAR_PRICES } from '../src/data/initialDivarPrices';

interface DivarPriceAnalysisSectionProps {
    showToast?: (message: string, type: 'success' | 'error') => void;
}

export const DIVAR_SUPPORTED_MODELS = [
    { key: 'kmc eagle', label: 'کی‌ام‌سی ایگل (KMC Eagle)' },
    { key: 'jac j4', label: 'جک جی۴ (JAC J4)' },
    { key: 'bac x3-pro', label: 'بک ایکس۳ پرو (BAC X3 Pro)' },
    { key: 'kmc t8', label: 'کی‌ام‌سی تی۸ (KMC T8)' },
    { key: 'kmc x5', label: 'کی‌ام‌سی ایکس۵ (KMC X5)' },
    { key: 'kmc j7', label: 'کی‌ام‌سی جی۷ (KMC J7)' },
    { key: 'kmc sr3', label: 'کی‌ام‌سی اس‌آر۳ (KMC SR3)' },
    { key: 'kmc sr6-1.5l-turbo', label: 'کی‌ام‌سی اس‌آر۶ توربو (KMC SR6)' },
    { key: 'kmc ej7', label: 'کی‌ام‌سی برقی ای‌جی۷ (KMC EJ7)' },
    { key: 'kmc t9-pick-up', label: 'کی‌ام‌سی تی۹ پیکاپ (KMC T9)' }
];

export const DIVAR_SUPPORTED_CITIES = [
    { key: 'shiraz', label: 'شیراز 📍', shortLabel: 'شیراز' },
    { key: 'tehran', label: 'تهران 📍', shortLabel: 'تهران' },
    { key: 'isfahan', label: 'اصفهان 📍', shortLabel: 'اصفهان' },
    { key: 'iran', label: 'کل ایران (سراسر کشور) 🇮🇷', shortLabel: 'کل ایران' }
];

const CAR_DISPLAY_NAMES: Record<string, string> = {
    'kmc eagle': 'کی‌ام‌سی ایگل (KMC Eagle)',
    'jac j4': 'جک جی۴ (JAC J4)',
    'bac x3-pro': 'بک ایکس۳ پرو (BAC X3 Pro)',
    'kmc t8': 'کی‌ام‌سی تی۸ (KMC T8)',
    'kmc x5': 'کی‌ام‌سی ایکس۵ (KMC X5)',
    'kmc j7': 'کی‌ام‌سی جی۷ (KMC J7)',
    'kmc sr3': 'کی‌ام‌سی اس‌آر۳ (KMC SR3)',
    'kmc sr6-1.5l-turbo': 'کی‌ام‌سی اس‌آر۶ توربو (KMC SR6)',
    'kmc ej7': 'کی‌ام‌سی برقی ای‌جی۷ (KMC EJ7)',
    'kmc t9-pick-up': 'کی‌ام‌سی تی۹ پیکاپ (KMC T9)'
};

const getDisplayName = (carName: string): string => {
    const lower = (carName || '').trim().toLowerCase();
    return CAR_DISPLAY_NAMES[lower] || carName;
};

// Calculate Mode (most frequent price)
const calculateModePrice = (prices: number[]): { modePrice: number; count: number } => {
    if (prices.length === 0) return { modePrice: 0, count: 0 };
    
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    let mode = prices[0];

    for (const p of prices) {
        freq[p] = (freq[p] || 0) + 1;
        if (freq[p] > maxFreq) {
            maxFreq = freq[p];
            mode = p;
        }
    }

    return { modePrice: mode, count: maxFreq };
};

const STORAGE_CACHE_KEY = 'divar_prices_cache_v2';
const STORAGE_TIME_KEY = 'divar_prices_timestamp_v2';
const STORAGE_CITY_KEY = 'divar_prices_last_city_v2';

export const DivarPriceAnalysisSection: React.FC<DivarPriceAnalysisSectionProps> = ({ showToast }) => {
    const [items, setItems] = useState<DivarPriceItem[]>(() => {
        try {
            const cached = localStorage.getItem(STORAGE_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_DIVAR_PRICES;
    });

    const [lastUpdated, setLastUpdated] = useState<string>(() => {
        return localStorage.getItem(STORAGE_TIME_KEY) || 'پیش‌فرض ثبت‌شده';
    });

    const [activeCity, setActiveCity] = useState<string>(() => {
        return localStorage.getItem(STORAGE_CITY_KEY) || 'shiraz';
    });

    const [selectedCar, setSelectedCar] = useState<string>('kmc eagle');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [queryingCarName, setQueryingCarName] = useState<string>('کی‌ام‌سی ایگل');
    const [queryingCityName, setQueryingCityName] = useState<string>('شیراز');

    const abortControllerRef = useRef<AbortController | null>(null);
    const timerIntervalRef = useRef<any>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [onlyZeroKm, setOnlyZeroKm] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<'price_desc' | 'price_asc' | 'km_asc'>('price_desc');
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    // Perform targeted query by model & city
    const handleQueryDivar = async (targetModel: string, targetCity: string) => {
        const queryModel = targetModel || selectedCar;
        const queryCity = targetCity || activeCity;

        const carLabel = getDisplayName(queryModel);
        const cityObj = DIVAR_SUPPORTED_CITIES.find(c => c.key === queryCity) || DIVAR_SUPPORTED_CITIES[0];
        setQueryingCarName(carLabel);
        setQueryingCityName(cityObj.label);

        // Abort previous query if still running
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        setIsLoading(true);
        setElapsedSeconds(0);
        setFetchError(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        try {
            const result = await getDivarPrices(queryModel, queryCity, controller.signal);
            if (result && Array.isArray(result)) {
                // Ensure items have proper car_name
                const cleanedResult = result.map(i => ({
                    ...i,
                    car_name: i.car_name || queryModel
                }));

                // Update items in cache and state
                setItems(prevItems => {
                    const otherItems = prevItems.filter(
                        p => (p.car_name || '').trim().toLowerCase() !== queryModel.toLowerCase()
                    );
                    const newItems = [...cleanedResult, ...otherItems];
                    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(newItems));
                    return newItems;
                });

                const nowStr = `${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} (${cityObj.shortLabel})`;
                setLastUpdated(nowStr);
                localStorage.setItem(STORAGE_TIME_KEY, nowStr);
                localStorage.setItem(STORAGE_CITY_KEY, queryCity);

                const validCount = cleanedResult.filter(i => typeof i.price === 'number' && i.price > 0).length;
                if (showToast) {
                    showToast(`استعلام ${carLabel} در ${cityObj.shortLabel} با موفقیت دریافت شد (${validCount} آگهی دارای قیمت)`, 'success');
                }
            } else {
                throw new Error('داده‌ای از دیوار دریافت نشد');
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Ignore silent cancellation on user switch
            } else {
                const msg = err.message || 'خطا در استعلام قیمت از دیوار';
                setFetchError(msg);
                if (showToast) showToast(msg, 'error');
            }
        } finally {
            setIsLoading(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            abortControllerRef.current = null;
        }
    };

    // Trigger auto-query when car changes
    const handleCarChange = (newCar: string) => {
        setSelectedCar(newCar);
        handleQueryDivar(newCar, activeCity);
    };

    // Trigger auto-query when city changes
    const handleCityChange = (newCity: string) => {
        setActiveCity(newCity);
        handleQueryDivar(selectedCar, newCity);
    };

    const handleCancelFetch = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (showToast) showToast('استعلام لغو شد', 'error');
    };

    // Group items by car
    const modelStatsList: DivarModelStats[] = useMemo(() => {
        const groups: Record<string, DivarPriceItem[]> = {};

        DIVAR_SUPPORTED_MODELS.forEach(m => {
            groups[m.key] = [];
        });

        items.forEach(item => {
            const rawName = (item.car_name || 'نامشخص').trim().toLowerCase();
            if (!groups[rawName]) {
                groups[rawName] = [];
            }
            groups[rawName].push(item);
        });

        return Object.entries(groups).map(([carName, itemList]) => {
            const validPrices = itemList
                .map(i => i.price)
                .filter((p): p is number => typeof p === 'number' && p > 0);

            const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
            const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
            const avgPrice = validPrices.length > 0 
                ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) 
                : 0;

            const { modePrice, count: modeCount } = calculateModePrice(validPrices);

            let zeroKmCount = 0;
            let usedCount = 0;

            itemList.forEach(i => {
                if (i.km !== null) {
                    const kmNum = parseInt((i.km || '').replace(/[^\d]/g, ''), 10);
                    if (kmNum === 0) zeroKmCount++;
                    else if (kmNum > 0) usedCount++;
                }
            });

            return {
                car_name: carName,
                displayName: getDisplayName(carName),
                totalListings: itemList.length,
                validPriceCount: validPrices.length,
                minPrice,
                maxPrice,
                avgPrice,
                modePrice,
                modeCount,
                priceSpread: maxPrice > 0 && minPrice > 0 ? maxPrice - minPrice : 0,
                zeroKmCount,
                usedCount,
                items: itemList
            };
        });
    }, [items]);

    // Active car stats
    const activeCarStats = useMemo(() => {
        const found = modelStatsList.find(m => m.car_name === selectedCar);
        if (found) return found;

        return {
            car_name: selectedCar,
            displayName: getDisplayName(selectedCar),
            totalListings: 0,
            validPriceCount: 0,
            minPrice: 0,
            maxPrice: 0,
            avgPrice: 0,
            modePrice: 0,
            modeCount: 0,
            priceSpread: 0,
            zeroKmCount: 0,
            usedCount: 0,
            items: []
        };
    }, [modelStatsList, selectedCar]);

    // Filtered ads of the selected car
    const selectedCarAds = useMemo(() => {
        return items.filter(item => (item.car_name || '').trim().toLowerCase() === selectedCar);
    }, [items, selectedCar]);

    // Processed data for Scatter Chart
    const scatterChartData = useMemo(() => {
        return selectedCarAds
            .filter((ad): ad is DivarPriceItem & { price: number } => typeof ad.price === 'number' && ad.price > 0)
            .map((ad, idx) => {
                const isMax = ad.price === activeCarStats.maxPrice;
                const isMin = ad.price === activeCarStats.minPrice;
                const isMode = ad.price === activeCarStats.modePrice;
                
                let color = '#4f46e5'; // indigo default
                let radius = 6;
                let statusLabel = 'عادی';

                if (isMax) {
                    color = '#10b981'; // emerald
                    radius = 8;
                    statusLabel = 'سقف قیمت (بیشترین)';
                } else if (isMin) {
                    color = '#f43f5e'; // rose
                    radius = 8;
                    statusLabel = 'کف قیمت (کمترین)';
                } else if (isMode) {
                    color = '#8b5cf6'; // purple
                    radius = 7.5;
                    statusLabel = 'بیشترین تکرار (نرخ متمرکز)';
                }

                return {
                    index: idx + 1,
                    price: ad.price,
                    title: ad.title || `آگهی شماره ${idx + 1}`,
                    km: ad.km !== null ? (ad.km === '0' ? 'صفر کیلومتر' : `${ad.km} ک.م`) : 'نامشخص',
                    desc: ad.desc || '',
                    color,
                    radius,
                    statusLabel,
                    isMax,
                    isMin,
                    isMode
                };
            });
    }, [selectedCarAds, activeCarStats]);

    // Calculate Y-axis domain with padding so ReferenceLines fit comfortably
    const yAxisDomain = useMemo(() => {
        if (!activeCarStats.minPrice || !activeCarStats.maxPrice) return ['auto', 'auto'];
        const spread = activeCarStats.priceSpread || 100_000_000;
        const padding = Math.max(spread * 0.15, 30_000_000);
        const minDomain = Math.max(0, activeCarStats.minPrice - padding);
        const maxDomain = activeCarStats.maxPrice + padding;
        return [minDomain, maxDomain];
    }, [activeCarStats]);

    // Filtered ads for table
    const tableAds = useMemo(() => {
        return selectedCarAds.filter(item => {
            if (onlyZeroKm) {
                const kmClean = (item.km || '').trim();
                if (kmClean !== '0') return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const titleMatch = (item.title || '').toLowerCase().includes(q);
                const descMatch = (item.desc || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch) return false;
            }
            return true;
        }).sort((a, b) => {
            const pA = a.price || 0;
            const pB = b.price || 0;
            if (sortOrder === 'price_desc') return pB - pA;
            if (sortOrder === 'price_asc') return pA - pB;
            if (sortOrder === 'km_asc') {
                const kmA = parseInt((a.km || '999999').replace(/[^\d]/g, ''), 10) || 0;
                const kmB = parseInt((b.km || '999999').replace(/[^\d]/g, ''), 10) || 0;
                return kmA - kmB;
            }
            return 0;
        });
    }, [selectedCarAds, onlyZeroKm, searchQuery, sortOrder]);

    const formatPriceShort = (val: number) => {
        if (!val) return '۰';
        const billions = val / 1_000_000_000;
        return `${billions.toFixed(2)} م.ت`;
    };

    const handleCopySummary = () => {
        const cityLabel = DIVAR_SUPPORTED_CITIES.find(c => c.key === activeCity)?.label || activeCity;
        const text = `📊 *تحلیل قیمت دیوار خودرو ${activeCarStats.displayName}*
شهر استعلام: ${cityLabel}
زمان: ${lastUpdated}

🔺 سقف و بیشترین قیمت: ${activeCarStats.maxPrice.toLocaleString('fa-IR')} تومان
⚖️ قیمت میانگین: ${activeCarStats.avgPrice.toLocaleString('fa-IR')} تومان
🔁 بیشترین تکرار قیمت: ${activeCarStats.modePrice.toLocaleString('fa-IR')} تومان (${activeCarStats.modeCount.toLocaleString('fa-IR')} آگهی)
🔻 کف و کمترین قیمت: ${activeCarStats.minPrice.toLocaleString('fa-IR')} تومان
📈 دامنه نوسان قیمت: ${activeCarStats.priceSpread.toLocaleString('fa-IR')} تومان
🔢 تعداد کل آگهی‌های رصد شده: ${activeCarStats.validPriceCount.toLocaleString('fa-IR')} عدد

منبع: استعلام برخط دیوار (حسینی خودرو)`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        if (showToast) showToast('گزارش تحلیلی کپی شد', 'success');
        setTimeout(() => setCopiedSummary(false), 2500);
    };

    // Calculate position percentages for visual spectrum
    const avgPercentage = useMemo(() => {
        if (!activeCarStats.priceSpread || activeCarStats.priceSpread <= 0) return 50;
        const pct = ((activeCarStats.avgPrice - activeCarStats.minPrice) / activeCarStats.priceSpread) * 100;
        return Math.min(Math.max(pct, 5), 95);
    }, [activeCarStats]);

    const modePercentage = useMemo(() => {
        if (!activeCarStats.priceSpread || activeCarStats.priceSpread <= 0) return 50;
        const pct = ((activeCarStats.modePrice - activeCarStats.minPrice) / activeCarStats.priceSpread) * 100;
        return Math.min(Math.max(pct, 5), 95);
    }, [activeCarStats]);

    const activeCityObj = DIVAR_SUPPORTED_CITIES.find(c => c.key === activeCity) || DIVAR_SUPPORTED_CITIES[0];

    return (
        <section className="space-y-6">
            {/* Top Control Bar: Single Query by Model & City */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center font-black shadow-md shadow-rose-200 dark:shadow-none">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                    استعلام تکی و تحلیل قیمت‌های دیوار
                                </h2>
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                    استعلام خودکار با تغییر فیلتر ⚡
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>آخرین استعلام:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{lastUpdated}</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span>شهر فعلی: <strong className="text-rose-600 dark:text-rose-400">{activeCityObj.label}</strong></span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopySummary}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-stretch sm:self-auto justify-center"
                    >
                        {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                        <span>{copiedSummary ? 'کپی شد' : 'کپی گزارش قیمت دیوار'}</span>
                    </button>
                </div>

                {/* Model and City Selector Bar */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Model Dropdown */}
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                            <Car className="w-4 h-4 text-rose-600" />
                            <span>خودرو:</span>
                        </label>
                        <select
                            value={selectedCar}
                            disabled={isLoading}
                            onChange={(e) => handleCarChange(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 cursor-pointer"
                        >
                            {DIVAR_SUPPORTED_MODELS.map(m => (
                                <option key={m.key} value={m.key}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Tabs / Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                            <MapPin className="w-4 h-4 text-rose-600" />
                            <span>شهر:</span>
                        </label>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            {DIVAR_SUPPORTED_CITIES.map(city => {
                                const isActive = activeCity === city.key;
                                return (
                                    <button
                                        key={city.key}
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => handleCityChange(city.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer disabled:opacity-60 ${
                                            isActive
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {city.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Manual Refresh / Indicator Button */}
                    <div>
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled
                                    className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm opacity-95 cursor-wait"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>در حال استخراج ({elapsedSeconds} ثانیه)...</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelFetch}
                                    className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 cursor-pointer flex items-center gap-1"
                                    title="لغو استعلام"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>لغو</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleQueryDivar(selectedCar, activeCity)}
                                className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-200 dark:shadow-none cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>استعلام مجدد برخط</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Model Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">انتخاب سریع:</span>
                    {DIVAR_SUPPORTED_MODELS.map(m => {
                        const isSelected = selectedCar === m.key;
                        const stats = modelStatsList.find(s => s.car_name === m.key);
                        const count = stats?.validPriceCount || 0;

                        return (
                            <button
                                key={m.key}
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleCarChange(m.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                                    isSelected
                                        ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>{m.label.split('(')[0].trim()}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                    isSelected ? 'bg-rose-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Prominent Loading & Waiting Banner When Extracting Data */}
            {isLoading && (
                <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border-2 border-rose-500/60 shadow-xl animate-pulse">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/50">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-white">
                                        در حال استخراج زنده قیمت‌های دیوار
                                    </h4>
                                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                                        ⏱ {elapsedSeconds} ثانیه
                                    </span>
                                </div>
                                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                                    سیستم در حال خزش و تجمیع آگهی‌های خودروی <strong className="text-amber-300 font-bold">{queryingCarName}</strong> در شهر <strong className="text-amber-300 font-bold">{queryingCityName}</strong> از سرور دیوار است.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                            <button
                                type="button"
                                onClick={handleCancelFetch}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                                <span>انصراف</span>
                            </button>
                        </div>
                    </div>

                    {/* Animated Striped Progress Bar */}
                    <div className="mt-4 pt-1">
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                            <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-rose-300/80 mt-1 font-mono">
                            <span>درخواست به وب‌هوک دیوار ارسال شده است</span>
                            <span>لطفاً چند لحظه شکیبا باشید...</span>
                        </div>
                    </div>
                </div>
            )}

            {fetchError && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>{fetchError} - در حال نمایش آخرین داده‌های ذخیره‌شده.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleQueryDivar(selectedCar, activeCity)}
                        className="px-3 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-lg font-bold cursor-pointer"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {/* Analysis Container With Translucent Overlay on Loading */}
            <div className="relative">
                {/* Visual Glassmorphism Backdrop Overlay When Loading */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-[2px] z-20 rounded-3xl flex flex-col items-center justify-center p-6 text-center transition-all animate-in fade-in duration-200">
                        <div className="bg-white/95 dark:bg-slate-850/95 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-300 dark:shadow-none">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-slate-800 dark:text-white">
                                    در حال استخراج داده‌ها از دیوار
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                    خودروی {queryingCarName} | {queryingCityName}
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-mono font-bold">
                                <span>زمان سپری‌شده:</span>
                                <span>{elapsedSeconds} ثانیه</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                خزشگر در حال جستجو در میان آگهی‌های دیوار است. لطفاً منتظر بمانید...
                            </p>
                            <button
                                type="button"
                                onClick={handleCancelFetch}
                                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                                لغو استعلام
                            </button>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 transition-all duration-300 ${isLoading ? 'opacity-40 filter blur-[0.5px] pointer-events-none' : 'opacity-100'}`}>
                    {/* Price Range Status Card for Selected Car */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-6 rounded-3xl shadow-md border border-slate-800 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-rose-400" />
                                    <h3 className="text-lg sm:text-xl font-black text-white">
                                        وضعیت بازه قیمتی {activeCarStats.displayName} در دیوار ({activeCityObj.label})
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 mt-1">
                                    تحلیل زنده بازه کف تا سقف و توزیع قیمت‌های این خودرو در شهر {activeCityObj.shortLabel}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                                    <span className="text-slate-300 ml-1.5">دامنه نوسان (فاصله سقف و کف):</span>
                                    <span className="font-mono font-black text-amber-300 text-sm">
                                        {activeCarStats.priceSpread > 0 ? activeCarStats.priceSpread.toLocaleString('fa-IR') : '۰'}
                                    </span>
                                    <span className="text-[10px] text-slate-300 mr-1">تومان</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                                    <span className="text-slate-300 ml-1.5">تعداد آگهی:</span>
                                    <span className="font-mono font-black text-emerald-300 text-sm">
                                        {activeCarStats.validPriceCount.toLocaleString('fa-IR')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Range Spectrum Track */}
                        {activeCarStats.validPriceCount > 0 ? (
                            <div className="mt-6 pt-2 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                                    <div className="flex items-center gap-1.5 text-rose-400">
                                        <span>🔻 کف قیمت:</span>
                                        <span className="font-mono text-white text-sm font-black">
                                            {activeCarStats.minPrice.toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-1 text-blue-300">
                                        <span>⚖️ میانگین:</span>
                                        <span className="font-mono text-white font-black">
                                            {activeCarStats.avgPrice.toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                        <span>🔺 سقف قیمت:</span>
                                        <span className="font-mono text-white text-sm font-black">
                                            {activeCarStats.maxPrice.toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>
                                </div>

                                {/* Visual Range Bar */}
                                <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden p-0.5">
                                    <div className="w-full h-full bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500 rounded-full opacity-85"></div>
                                    
                                    {/* Mode price indicator dot */}
                                    {activeCarStats.priceSpread > 0 && (
                                        <div 
                                            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-purple-400 border-2 border-white rounded-full shadow-lg"
                                            style={{ left: `${modePercentage}%` }}
                                            title={`پرتکرارترین نرخ: ${activeCarStats.modePrice.toLocaleString('fa-IR')} تومان`}
                                        />
                                    )}

                                    {/* Average price indicator tick */}
                                    {activeCarStats.priceSpread > 0 && (
                                        <div 
                                            className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-white shadow-md"
                                            style={{ left: `${avgPercentage}%` }}
                                            title={`قیمت میانگین: ${activeCarStats.avgPrice.toLocaleString('fa-IR')} تومان`}
                                        />
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        ارزان‌ترین پیشنهاد ({activeCarStats.minPrice.toLocaleString('fa-IR')} تومان)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border border-white"></span>
                                        نرخ متمرکز بازار (بیشترین تکرار: {activeCarStats.modePrice.toLocaleString('fa-IR')} تومان)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        گران‌ترین پیشنهاد ({activeCarStats.maxPrice.toLocaleString('fa-IR')} تومان)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-slate-400 text-xs">
                                در حال حاضر آگهی با قیمت مشخصی برای این خودرو در دیوار ثبت نشده است. می‌توانید دکمه استعلام برخط را فشار دهید.
                            </div>
                        )}
                    </div>

                    {/* 4 Core Statistics Cards Requested by User */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. سقف و بیشترین قیمت (Max Price) */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سقف و بیشترین قیمت</span>
                                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {activeCarStats.maxPrice > 0 ? activeCarStats.maxPrice.toLocaleString('fa-IR') : 'نامشخص'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">تومان</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                <span>سقف قیمت ثبت‌شده در دیوار برای این خودرو</span>
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
                        </div>

                        {/* 2. کف و کمترین قیمت (Min Price) */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کف و کمترین قیمت</span>
                                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <TrendingDown className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                                    {activeCarStats.minPrice > 0 ? activeCarStats.minPrice.toLocaleString('fa-IR') : 'نامشخص'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">تومان</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                <span>کف قیمت ثبت‌شده در دیوار برای این خودرو</span>
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
                        </div>

                        {/* 3. قیمت میانگین (Average Price) */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">قیمت میانگین</span>
                                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <Scale className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                    {activeCarStats.avgPrice > 0 ? activeCarStats.avgPrice.toLocaleString('fa-IR') : 'نامشخص'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">تومان</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                <span>میانگین قیمت کلیه آگهی‌های دیوار</span>
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                        </div>

                        {/* 4. بیشترین تکرار قیمت / پرتکرار (Mode Price) */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">بیشترین تکرار قیمت (پرتکرار)</span>
                                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                                    {activeCarStats.modePrice > 0 ? activeCarStats.modePrice.toLocaleString('fa-IR') : 'نامشخص'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">تومان</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                <span>تکرار: <strong>{activeCarStats.modeCount.toLocaleString('fa-IR')} بار</strong> (نرخ متمرکز بازار)</span>
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
                        </div>
                    </div>

                    {/* Dedicated Scatter Chart with Reference Lines (سقف، پرتکرار، میانگین، کف) */}
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                                    <span>نمودار پراکندگی آگهی‌ها و خطوط شاخص آماری</span>
                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                        {activeCarStats.displayName}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    موقعیت و کارکرد هر آگهی در دیوار همراه با خطوط سقف، میانگین، پرتکرار و کف قیمت در {activeCityObj.label}
                                </p>
                            </div>

                            {/* Quick indicator badges */}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span>سقف: {formatPriceShort(activeCarStats.maxPrice)}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                    <span>میانگین: {formatPriceShort(activeCarStats.avgPrice)}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                    <span>پرتکرار: {formatPriceShort(activeCarStats.modePrice)}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    <span>کف: {formatPriceShort(activeCarStats.minPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Scatter Chart Container */}
                        <div className="h-96 sm:h-[430px] w-full pt-2">
                            {scatterChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 25, right: 35, left: 15, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis 
                                            type="number" 
                                            dataKey="index" 
                                            name="ردیف آگهی"
                                            domain={[0, 'dataMax + 1']}
                                            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                                            label={{ 
                                                value: 'شماره آگهی ثبت‌شده در دیوار', 
                                                position: 'insideBottom', 
                                                offset: -12, 
                                                fill: '#94a3b8', 
                                                fontSize: 10,
                                                fontFamily: 'Vazirmatn'
                                            }}
                                        />
                                        <YAxis 
                                            type="number" 
                                            dataKey="price" 
                                            name="قیمت" 
                                            tickFormatter={formatPriceShort}
                                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Vazirmatn' }}
                                            domain={yAxisDomain}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload || !payload.length) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1.5 font-sans max-w-xs z-50">
                                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                                                            <span className="font-mono text-slate-400 text-[10px]">آگهی #{d.index}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                                d.isMax 
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                                                    : d.isMin 
                                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                                                    : d.isMode 
                                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' 
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                            }`}>
                                                                {d.statusLabel}
                                                            </span>
                                                        </div>
                                                        <p className="font-black text-slate-900 dark:text-white line-clamp-2">
                                                            {d.title}
                                                        </p>
                                                        <p className="text-slate-800 dark:text-slate-100 font-bold font-mono text-sm flex justify-between pt-1">
                                                            <span>قیمت آگهی:</span>
                                                            <span className="text-rose-600 dark:text-rose-400 font-black">
                                                                {d.price.toLocaleString('fa-IR')} تومان
                                                            </span>
                                                        </p>
                                                        <p className="text-slate-500 text-[11px] flex justify-between">
                                                            <span>کارکرد:</span>
                                                            <span className="font-bold">{d.km}</span>
                                                        </p>
                                                        {d.desc && (
                                                            <p className="text-slate-400 text-[10px] line-clamp-2 pt-1">
                                                                {d.desc}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        />

                                        {/* 1. سقف و بیشترین قیمت (Max Reference Line) */}
                                        {activeCarStats.maxPrice > 0 && (
                                            <ReferenceLine 
                                                y={activeCarStats.maxPrice} 
                                                stroke="#10b981" 
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                label={{ 
                                                    value: `🔺 سقف و بیشترین: ${activeCarStats.maxPrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#10b981', 
                                                    fontSize: 11, 
                                                    position: 'top',
                                                    fontFamily: 'Vazirmatn'
                                                }} 
                                            />
                                        )}

                                        {/* 2. قیمت میانگین (Average Reference Line) */}
                                        {activeCarStats.avgPrice > 0 && (
                                            <ReferenceLine 
                                                y={activeCarStats.avgPrice} 
                                                stroke="#3b82f6" 
                                                strokeDasharray="4 4"
                                                strokeWidth={1.5}
                                                label={{ 
                                                    value: `⚖️ میانگین: ${activeCarStats.avgPrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#3b82f6', 
                                                    fontSize: 10, 
                                                    position: 'top',
                                                    fontFamily: 'Vazirmatn'
                                                }} 
                                            />
                                        )}

                                        {/* 3. بیشترین تکرار قیمت / پرتکرار (Mode Reference Line) */}
                                        {activeCarStats.modePrice > 0 && (
                                            <ReferenceLine 
                                                y={activeCarStats.modePrice} 
                                                stroke="#8b5cf6" 
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                label={{ 
                                                    value: `🔁 پرتکرارترین نرخ (${activeCarStats.modeCount} آگهی): ${activeCarStats.modePrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#8b5cf6', 
                                                    fontSize: 11, 
                                                    position: 'bottom',
                                                    fontFamily: 'Vazirmatn'
                                                }} 
                                            />
                                        )}

                                        {/* 4. کف و کمترین قیمت (Min Reference Line) */}
                                        {activeCarStats.minPrice > 0 && (
                                            <ReferenceLine 
                                                y={activeCarStats.minPrice} 
                                                stroke="#f43f5e" 
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                label={{ 
                                                    value: `🔻 کف و کمترین: ${activeCarStats.minPrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#f43f5e', 
                                                    fontSize: 11, 
                                                    position: 'bottom',
                                                    fontFamily: 'Vazirmatn'
                                                }} 
                                            />
                                        )}

                                        <Scatter name="آگهی‌های دیوار" data={scatterChartData}>
                                            {scatterChartData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.color} 
                                                />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                                    <Info className="w-8 h-8 mb-2 opacity-50" />
                                    <span>داده‌ای برای رسم نمودار پراکندگی {activeCarStats.displayName} در {activeCityObj.label} موجود نیست</span>
                                    <button
                                        type="button"
                                        onClick={() => handleQueryDivar(selectedCar, activeCity)}
                                        className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        استعلام برخط این خودرو از دیوار
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Legend & Guide Bar */}
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span>
                                <span>سقف و بیشترین قیمت</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs"></span>
                                <span>قیمت میانگین حسابی</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span>
                                <span>بیشترین تکرار قیمت (نرخ متمرکز)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span>
                                <span>کف و کمترین قیمت</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                                <span>سایر آگهی‌های ثبت‌شده</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table of Ads for Selected Car */}
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-rose-500" />
                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                    لیست آگهی‌های دیوار {activeCarStats.displayName}
                                </h3>
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg font-mono font-bold">
                                    {tableAds.length.toLocaleString('fa-IR')} آگهی
                                </span>
                                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                                    ({activeCityObj.label})
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                                <div className="relative flex-1 sm:w-60">
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="جستجو در عنوان یا محله..."
                                        className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>

                                <label className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                                    <input
                                        type="checkbox"
                                        checked={onlyZeroKm}
                                        onChange={(e) => setOnlyZeroKm(e.target.checked)}
                                        className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                                    />
                                    <span>فقط صفر کیلومتر</span>
                                </label>

                                <select
                                    value={sortOrder}
                                    onChange={(e: any) => setSortOrder(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
                                    <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
                                    <option value="km_asc">کمترین کارکرد</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200/70 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="p-3 w-12 text-center">#</th>
                                        <th className="p-3">عنوان آگهی دیوار</th>
                                        <th className="p-3 text-center">قیمت (تومان)</th>
                                        <th className="p-3 text-center">وضعیت نسبت به بازه</th>
                                        <th className="p-3 text-center">کارکرد</th>
                                        <th className="p-3">محل و زمان درج آگهی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tableAds.length > 0 ? (
                                        tableAds.map((ad, idx) => {
                                            const isMax = ad.price !== null && ad.price === activeCarStats.maxPrice;
                                            const isMin = ad.price !== null && ad.price === activeCarStats.minPrice;
                                            const isMode = ad.price !== null && ad.price === activeCarStats.modePrice;

                                            return (
                                                <tr 
                                                    key={`${ad.car_name}-${idx}-${ad.price}`}
                                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <td className="p-3 text-center text-slate-400 font-mono">
                                                        {(idx + 1).toLocaleString('fa-IR')}
                                                    </td>
                                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                                        {ad.title || (
                                                            <span className="text-slate-400 italic">بدون عنوان</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center font-mono">
                                                        {ad.price ? (
                                                            <span className={`font-black text-sm ${
                                                                isMax 
                                                                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
                                                                    : isMin 
                                                                    ? 'text-rose-600 dark:text-rose-400 font-extrabold' 
                                                                    : isMode
                                                                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                                                                    : 'text-slate-800 dark:text-slate-100'
                                                            }`}>
                                                                {ad.price.toLocaleString('fa-IR')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isMax && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                                                سقف قیمت 🔺
                                                            </span>
                                                        )}
                                                        {isMin && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                                                                کف قیمت 🔻
                                                            </span>
                                                        )}
                                                        {isMode && !isMax && !isMin && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                                                پرتکرارترین 🔁
                                                            </span>
                                                        )}
                                                        {!isMax && !isMin && !isMode && ad.price && (
                                                            <span className="text-[10px] text-slate-400">
                                                                درون بازه
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center font-mono">
                                                        {ad.km !== null ? (
                                                            ad.km === '0' ? (
                                                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-sans font-bold text-[11px]">
                                                                    صفر کیلومتر
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                                                    {parseInt(ad.km, 10).toLocaleString('fa-IR')} ک.م
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                                        {ad.desc || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                                آگهی منطبق با فیلترها یافت نشد.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DivarPriceAnalysisSection;
