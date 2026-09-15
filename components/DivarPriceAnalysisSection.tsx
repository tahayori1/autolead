import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, 
    CartesianGrid, Cell, ReferenceLine
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Scale, Sparkles, RefreshCw, Clock, 
    Search, Car, Copy, Check, AlertCircle, ShieldAlert, 
    Info, FileText, Sliders, MapPin, Globe, CheckCircle2, Loader2, X,
    SlidersHorizontal, Layers, Eye, EyeOff, AlertTriangle, ExternalLink
} from 'lucide-react';
import type { DivarPriceItem, DivarModelStats, ScrapedCarPrice, CarPriceStats } from '../types';
import { getDivarPrices, getScrapedCarPrices } from '../services/api';

interface DivarPriceAnalysisSectionProps {
    showToast?: (message: string, type: 'success' | 'error') => void;
    otherPrices?: ScrapedCarPrice[];
    allSources?: string[];
    priceStats?: CarPriceStats[];
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

// Source marker styling config for other market sources
interface OtherSourceMarkerInfo {
    key: string;
    label: string;
    markerType: 'triangle';
    markerSymbol: string;
    color: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

const getSourceMarkerStyle = (sourceName: string): OtherSourceMarkerInfo => {
    const s = (sourceName || '').toLowerCase().trim();
    if (s.includes('bama')) {
        return {
            key: 'bama',
            label: 'باما (BAMA)',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#f59e0b', // amber-500
            bgClass: 'bg-amber-50 dark:bg-amber-950/60',
            textClass: 'text-amber-700 dark:text-amber-300',
            borderClass: 'border-amber-200 dark:border-amber-800'
        };
    }
    if (s.includes('khodro45')) {
        return {
            key: 'khodro45',
            label: 'خودرو۴۵ (Khodro45)',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#0d9488', // teal-600
            bgClass: 'bg-teal-50 dark:bg-teal-950/60',
            textClass: 'text-teal-700 dark:text-teal-300',
            borderClass: 'border-teal-200 dark:border-teal-800'
        };
    }
    if (s.includes('karnameh')) {
        return {
            key: 'karnameh',
            label: 'کارنامه (Karnameh)',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#0284c7', // sky-600
            bgClass: 'bg-sky-50 dark:bg-sky-950/60',
            textClass: 'text-sky-700 dark:text-sky-300',
            borderClass: 'border-sky-200 dark:border-sky-800'
        };
    }
    if (s.includes('car.ir') || s.includes('carir')) {
        return {
            key: 'car.ir',
            label: 'کار.آی‌آر (Car.ir)',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#7c3aed', // violet-600
            bgClass: 'bg-violet-50 dark:bg-violet-950/60',
            textClass: 'text-violet-700 dark:text-violet-300',
            borderClass: 'border-violet-200 dark:border-violet-800'
        };
    }
    if (s.includes('iranjib') || s.includes('iran_jib')) {
        return {
            key: 'iranjib',
            label: 'ایران‌جیب (IranJib)',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#16a34a', // green-600
            bgClass: 'bg-green-50 dark:bg-green-950/60',
            textClass: 'text-green-700 dark:text-green-300',
            borderClass: 'border-green-200 dark:border-green-800'
        };
    }
    if (s.includes('custom') || s.includes('hm') || s.includes('hoseini') || s.includes('نمایندگی') || s.includes('مصوب')) {
        return {
            key: 'custom',
            label: 'نرخ مصوب مدیر فروش',
            markerType: 'triangle',
            markerSymbol: '▲',
            color: '#e11d48', // rose-600
            bgClass: 'bg-rose-50 dark:bg-rose-950/60',
            textClass: 'text-rose-700 dark:text-rose-300',
            borderClass: 'border-rose-200 dark:border-rose-800'
        };
    }
    return {
        key: s,
        label: sourceName,
        markerType: 'triangle',
        markerSymbol: '▲',
        color: '#475569', // slate-600
        bgClass: 'bg-slate-50 dark:bg-slate-900',
        textClass: 'text-slate-700 dark:text-slate-300',
        borderClass: 'border-slate-200 dark:border-slate-700'
    };
};

// Match prices from other sources against selected car
const matchOtherPricesForCar = (carKey: string, allOtherPrices: ScrapedCarPrice[]): ScrapedCarPrice[] => {
    if (!allOtherPrices || allOtherPrices.length === 0) return [];

    const keywordsMap: Record<string, string[]> = {
        'kmc eagle': ['eagle', 'ایگل'],
        'jac j4': ['j4', 'جی۴', 'جی 4', 'jac j4'],
        'bac x3-pro': ['x3', 'bac', 'بک'],
        'kmc t8': ['t8', 'تی۸', 'تی 8', 'kmc t8'],
        'kmc x5': ['x5', 'ایکس۵', 'ایکس ۵', 'kmc x5'],
        'kmc j7': ['j7', 'جی۷', 'جی 7', 'kmc j7'],
        'kmc sr3': ['sr3', 'اس آر ۳', 'اس‌آر۳'],
        'kmc sr6-1.5l-turbo': ['sr6', 'اس آر ۶', 'اس‌آر۶'],
        'kmc ej7': ['ej7', 'برقی', 'ای جی ۷'],
        'kmc t9-pick-up': ['t9', 'تی۹', 'تی 9', 'kmc t9']
    };

    const keywords = keywordsMap[carKey] || [carKey];

    const matched = allOtherPrices.filter(p => {
        if (!p || !p.model_name || !p.price_rial || p.price_rial <= 0) return false;
        const modelLower = p.model_name.toLowerCase();
        return keywords.some(kw => modelLower.includes(kw.toLowerCase()));
    });

    // Deduplicate by source_name + model_name (prefer most recent)
    const seen = new Set<string>();
    const deduped: ScrapedCarPrice[] = [];
    for (const item of matched) {
        const key = `${item.source_name}-${item.model_name}`;
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(item);
        }
    }
    return deduped;
};

const STORAGE_CACHE_KEY = 'divar_live_prices_v4';
const STORAGE_TIME_KEY = 'divar_live_timestamp_v4';
const STORAGE_CITY_KEY = 'divar_live_last_city_v4';

export const DivarPriceAnalysisSection: React.FC<DivarPriceAnalysisSectionProps> = ({ 
    showToast,
    otherPrices: propOtherPrices,
    allSources,
    priceStats
}) => {
    const [items, setItems] = useState<DivarPriceItem[]>(() => {
        try {
            localStorage.removeItem('divar_prices_cache_v2');
            localStorage.removeItem('divar_prices_timestamp_v2');
            localStorage.removeItem('divar_prices_last_city_v2');

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
        return [];
    });

    const [lastUpdated, setLastUpdated] = useState<string>(() => {
        return localStorage.getItem(STORAGE_TIME_KEY) || 'هنوز استعلام نشده';
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

    // Normalization & View Settings (Normalized is true by default per user request)
    const [isNormalized, setIsNormalized] = useState<boolean>(true);
    const [showOtherSourcesOnChart, setShowOtherSourcesOnChart] = useState<boolean>(true);
    const [showOtherSourceLines, setShowOtherSourceLines] = useState<boolean>(true);
    const [showOutliersModal, setShowOutliersModal] = useState<boolean>(false);

    // Fallback fetching for other prices if not provided as props
    const [fetchedOtherPrices, setFetchedOtherPrices] = useState<ScrapedCarPrice[]>([]);

    useEffect(() => {
        if (!propOtherPrices || propOtherPrices.length === 0) {
            getScrapedCarPrices()
                .then(data => {
                    if (Array.isArray(data)) setFetchedOtherPrices(data);
                })
                .catch(() => {});
        }
    }, [propOtherPrices]);

    const effectiveOtherPrices = useMemo(() => {
        if (propOtherPrices && propOtherPrices.length > 0) return propOtherPrices;
        return fetchedOtherPrices;
    }, [propOtherPrices, fetchedOtherPrices]);

    const abortControllerRef = useRef<AbortController | null>(null);
    const timerIntervalRef = useRef<any>(null);
    const hasInitialMountedRef = useRef<boolean>(false);

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

    // Auto-query on initial mount so fresh real-time data is loaded without any default expired prices
    useEffect(() => {
        if (!hasInitialMountedRef.current) {
            hasInitialMountedRef.current = true;
            handleQueryDivar(selectedCar, activeCity);
        }
    }, []);

    // Filtered ads of the selected car
    const selectedCarAds = useMemo(() => {
        return items.filter(item => (item.car_name || '').trim().toLowerCase() === selectedCar);
    }, [items, selectedCar]);

    // Statistical Normalization Analysis for Divar Ads:
    // Rule: "قیمت های دیوار نرمال سازی شود اگر قیمت درج شده ۵۰درصد بیشتر یا کمتر از اکثر قیمت ها بود از داده ها حذف شود"
    const normalizationAnalysis = useMemo(() => {
        const validAds = selectedCarAds.filter(
            (ad): ad is DivarPriceItem & { price: number } => typeof ad.price === 'number' && ad.price > 0
        );

        if (validAds.length === 0) {
            return {
                majorityPrice: 0,
                minAllowed: 0,
                maxAllowed: Infinity,
                normalAds: [] as (DivarPriceItem & { price: number })[],
                outlierAds: [] as {
                    ad: DivarPriceItem & { price: number };
                    reason: 'too_low' | 'too_high';
                    deviationPct: number;
                }[],
                outlierCount: 0,
                majorityLabel: 'داده‌ای یافت نشد'
            };
        }

        const prices = validAds.map(a => a.price);

        // 1. Mode Calculation
        const { modePrice, count: modeCount } = calculateModePrice(prices);

        // 2. Median Calculation
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const medianPrice = sorted.length % 2 !== 0 
            ? sorted[mid] 
            : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

        // 3. Majority Price Selection ("اکثر قیمت‌ها"):
        let majorityPrice = medianPrice;
        let majorityLabel = `میانه قیمت‌ها (${(medianPrice / 1_000_000_000).toFixed(2)} م.ت)`;
        if (modeCount >= 2 && modePrice > 0) {
            if (medianPrice > 0 && Math.abs(modePrice - medianPrice) / medianPrice <= 0.40) {
                majorityPrice = modePrice;
                majorityLabel = `نرخ پرتکرار با ${modeCount} آگهی (${(modePrice / 1_000_000_000).toFixed(2)} م.ت)`;
            }
        }

        // 50% Threshold Rules:
        const minAllowed = majorityPrice * 0.5; // 50% less
        const maxAllowed = majorityPrice * 1.5; // 50% more

        const normalAds: (DivarPriceItem & { price: number })[] = [];
        const outlierAds: {
            ad: DivarPriceItem & { price: number };
            reason: 'too_low' | 'too_high';
            deviationPct: number;
        }[] = [];

        validAds.forEach(ad => {
            const p = ad.price;
            if (p < minAllowed) {
                const diffPct = Math.round(((majorityPrice - p) / majorityPrice) * 100);
                outlierAds.push({ ad, reason: 'too_low', deviationPct: diffPct });
            } else if (p > maxAllowed) {
                const diffPct = Math.round(((p - majorityPrice) / majorityPrice) * 100);
                outlierAds.push({ ad, reason: 'too_high', deviationPct: diffPct });
            } else {
                normalAds.push(ad);
            }
        });

        return {
            majorityPrice,
            minAllowed,
            maxAllowed,
            normalAds,
            outlierAds,
            outlierCount: outlierAds.length,
            majorityLabel
        };
    }, [selectedCarAds]);

    // Ads to display based on isNormalized flag
    const activeEffectiveAds = useMemo(() => {
        if (!isNormalized) {
            return selectedCarAds.filter(
                (ad): ad is DivarPriceItem & { price: number } => typeof ad.price === 'number' && ad.price > 0
            );
        }
        return normalizationAnalysis.normalAds;
    }, [isNormalized, selectedCarAds, normalizationAnalysis]);

    // Active car stats recalculated based on active normalization state
    const activeCarStats = useMemo(() => {
        const prices = activeEffectiveAds.map(a => a.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const { modePrice, count: modeCount } = calculateModePrice(prices);

        let zeroKmCount = 0;
        let usedCount = 0;
        activeEffectiveAds.forEach(i => {
            if (i.km !== null) {
                const kmNum = parseInt((i.km || '').replace(/[^\d]/g, ''), 10);
                if (kmNum === 0) zeroKmCount++;
                else if (kmNum > 0) usedCount++;
            }
        });

        return {
            car_name: selectedCar,
            displayName: getDisplayName(selectedCar),
            totalListings: activeEffectiveAds.length,
            validPriceCount: prices.length,
            minPrice,
            maxPrice,
            avgPrice,
            modePrice,
            modeCount,
            priceSpread: maxPrice > 0 && minPrice > 0 ? maxPrice - minPrice : 0,
            zeroKmCount,
            usedCount,
            items: activeEffectiveAds
        };
    }, [activeEffectiveAds, selectedCar]);

    // Processed data for Divar ads Scatter Chart
    const divarScatterData = useMemo(() => {
        return activeEffectiveAds.map((ad, idx) => {
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

            // In non-normalized view, mark outliers with high-visibility warning color
            const outlierInfo = normalizationAnalysis.outlierAds.find(o => o.ad === ad);
            if (!isNormalized && outlierInfo) {
                color = '#ea580c'; // orange-600 warning
                radius = 8.5;
                statusLabel = outlierInfo.reason === 'too_low' 
                    ? `⚠️ قیمت پرت و غیرمتعارف (-${outlierInfo.deviationPct}٪ زیر نرخ اکثر)` 
                    : `⚠️ قیمت پرت و غیرمتعارف (+${outlierInfo.deviationPct}٪ بالای نرخ اکثر)`;
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
                isMode,
                isOutlier: !!outlierInfo,
                isOtherSource: false
            };
        });
    }, [activeEffectiveAds, activeCarStats, isNormalized, normalizationAnalysis]);

    // Processed data for all matched other market sources
    const allMatchedOtherSources = useMemo(() => {
        const matched = matchOtherPricesForCar(selectedCar, effectiveOtherPrices);
        if (matched.length === 0) return [];

        const N = divarScatterData.length;
        const count = matched.length;

        return matched.map((item, idx) => {
            const style = getSourceMarkerStyle(item.source_name);
            // Distribute along X axis evenly alongside Divar ads
            const step = N > 0 ? (N / (count + 1)) : 1;
            const xPos = N > 0 ? Math.max(1, Math.round((idx + 1) * step)) : (idx + 1);

            const baseDivar = activeCarStats.avgPrice || activeCarStats.modePrice;
            const diffPct = baseDivar > 0 
                ? Number((((item.price_rial - baseDivar) / baseDivar) * 100).toFixed(1))
                : undefined;

            return {
                index: xPos,
                price: item.price_rial,
                sourceName: item.source_name,
                sourceLabel: style.label,
                modelName: item.model_name,
                markerType: style.markerType,
                markerSymbol: style.markerSymbol,
                color: style.color,
                bgClass: style.bgClass,
                textClass: style.textClass,
                borderClass: style.borderClass,
                capturedAt: item.captured_at,
                diffWithDivarAvg: diffPct,
                isOtherSource: true
            };
        });
    }, [selectedCar, effectiveOtherPrices, divarScatterData.length, activeCarStats]);

    // Data points specifically for the scatter chart (when overlay is enabled)
    const otherSourcesScatterData = useMemo(() => {
        if (!showOtherSourcesOnChart) return [];
        return allMatchedOtherSources;
    }, [showOtherSourcesOnChart, allMatchedOtherSources]);

    // Calculate Y-axis domain incorporating both Divar and other sources
    const yAxisDomain = useMemo(() => {
        const prices: number[] = [];
        divarScatterData.forEach(d => prices.push(d.price));
        if (showOtherSourcesOnChart) {
            otherSourcesScatterData.forEach(d => prices.push(d.price));
        }

        if (prices.length === 0) return ['auto', 'auto'];

        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const spread = maxP - minP || 100_000_000;
        const padding = Math.max(spread * 0.12, 30_000_000);

        return [Math.max(0, minP - padding), maxP + padding];
    }, [divarScatterData, otherSourcesScatterData, showOtherSourcesOnChart]);

    // Filtered ads for table
    const tableAds = useMemo(() => {
        return activeEffectiveAds.filter(item => {
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
    }, [activeEffectiveAds, onlyZeroKm, searchQuery, sortOrder]);

    const formatPriceShort = (val: number) => {
        if (!val || val <= 0) return 'نامشخص';
        const billions = val / 1_000_000_000;
        return `${billions.toFixed(2)} م.ت`;
    };

    const handleCopySummary = () => {
        const cityLabel = DIVAR_SUPPORTED_CITIES.find(c => c.key === activeCity)?.label || activeCity;
        const normStatus = isNormalized ? 'نرمال‌شده (فیلتر نوسانات ۵۰٪±)' : 'داده‌های خام (غیرنرمال)';
        const text = `📊 *تحلیل قیمت دیوار خودرو ${activeCarStats.displayName}*
شهر استعلام: ${cityLabel}
وضعیت نمودار: ${normStatus}
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

    const activeCityObj = DIVAR_SUPPORTED_CITIES.find(c => c.key === activeCity) || DIVAR_SUPPORTED_CITIES[0];

    // SVG Shape Renderer for other sources in Recharts Scatter (نشانگر مثلثی ▲ برای همه مراجع + درج نام مرجع)
    const renderOtherSourceShape = (props: any) => {
        const { cx, cy, payload } = props;
        if (!cx || !cy || !payload) return null;
        const { color, sourceLabel } = payload;

        // Size of the triangle marker
        const size = 11;
        // Clean Persian name of the source (e.g., باما، خودرو۴۵، کارنامه، کار.آی‌آر، ایران‌جیب، نرخ مصوب)
        const name = (sourceLabel || '').split('(')[0].trim();
        const textWidth = Math.max(name.length * 8.5 + 14, 34);

        return (
            <g key={`marker-triangle-${cx}-${cy}`} className="cursor-pointer">
                {/* Source Name Badge directly above the triangle marker */}
                <rect
                    x={cx - textWidth / 2}
                    y={cy - size - 17}
                    width={textWidth}
                    height={16}
                    rx={4}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={1.5}
                    className="filter drop-shadow-sm opacity-95"
                />
                <text
                    x={cx}
                    y={cy - size - 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={9.5}
                    fontWeight="bold"
                    fontFamily="Vazirmatn, sans-serif"
                    className="select-none pointer-events-none"
                >
                    {name}
                </text>

                {/* Upright Triangle Marker (همگی مثلث) */}
                <polygon
                    points={`${cx},${cy - size} ${cx + size},${cy + size * 0.85} ${cx - size},${cy + size * 0.85}`}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="filter drop-shadow-md"
                />
            </g>
        );
    };

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
                                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                                    برخط و زنده
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>آخرین استعلام:</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastUpdated}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            disabled={activeCarStats.validPriceCount === 0}
                            className="w-full md:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="کپی متن خلاصه تحلیل جهت اشتراک در تلگرام / واتساپ"
                        >
                            {copiedSummary ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedSummary ? 'کپی شد' : 'کپی خلاصه تحلیل'}</span>
                        </button>
                    </div>
                </div>

                {/* Primary Query Selectors: Model & City */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Model Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                            <Car className="w-4 h-4 text-rose-600" />
                            <span>خودرو:</span>
                        </label>
                        <select
                            value={selectedCar}
                            disabled={isLoading}
                            onChange={(e) => handleCarChange(e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer disabled:opacity-60"
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
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full">
                            {DIVAR_SUPPORTED_CITIES.map(city => {
                                const isActive = activeCity === city.key;
                                return (
                                    <button
                                        key={city.key}
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => handleCityChange(city.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer disabled:opacity-60 flex-1 ${
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
                    <div className="flex items-center">
                        {isLoading ? (
                            <div className="flex items-center gap-2 w-full">
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm opacity-95 cursor-wait"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>در حال استخراج ({elapsedSeconds} ثانیه)...</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelFetch}
                                    className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 cursor-pointer flex items-center gap-1 shrink-0"
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
                                className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-200 dark:shadow-none cursor-pointer"
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
                    
                    {/* Normalization & External Sources Toggle Bar */}
                    <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* Normalization Segmented Controller */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                                <span>وضعیت پردازش داده:</span>
                            </span>
                            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setIsNormalized(true)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isNormalized
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>نمودار نرمال‌شده (پیش‌فرض)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNormalized(false)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                        !isNormalized
                                            ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>نمودار خام و غیرنرمال</span>
                                </button>
                            </div>
                        </div>

                        {/* Normalization Status & Outlier Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                            {isNormalized ? (
                                normalizationAnalysis.outlierCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowOutliersModal(true)}
                                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-all cursor-pointer"
                                        title="مشاهده آگهی‌های غیرمتعارف فیلترشده"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                        <span>
                                            {normalizationAnalysis.outlierCount.toLocaleString('fa-IR')} آگهی پرت (۵۰٪±) حذف شد
                                        </span>
                                        <span className="text-[10px] underline">جزئیات</span>
                                    </button>
                                ) : (
                                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>داده‌ها یکدست و بدون انحراف ۵۰٪ است</span>
                                    </div>
                                )
                            ) : (
                                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>حالت خام: همه آگهی‌ها (حتی قیمت‌های پیش‌پرداخت/پرت) نمایش داده می‌شوند</span>
                                </div>
                            )}

                            {/* Toggle Other Sources in Scatter */}
                            <button
                                type="button"
                                onClick={() => setShowOtherSourcesOnChart(!showOtherSourcesOnChart)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    showOtherSourcesOnChart
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}
                                title="نمایش یا عدم نمایش نشانگرهای مثلثی باما، خودرو۴۵، کارنامه و ... روی نمودار"
                            >
                                {showOtherSourcesOnChart ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>نشانگر سایر مراجع در نمودار ({allMatchedOtherSources.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Dedicated Scatter Chart with Divar Ads & Other Sources */}
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                                    <span>نمودار پراکندگی آگهی‌های دیوار و سایر مراجع بازار</span>
                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                        {activeCarStats.displayName}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {isNormalized 
                                        ? 'نمودار نرمال‌شده بر مبنای نرخ متمرکز (حذف خودکار داده‌های نامتعارف ±۵۰٪) همراه با نشانگر مثلثی سایر مراجع بازار'
                                        : 'نمودار خام شامل کلیه آگهی‌های دیوار همراه با نشانگر مثلثی سایر منابع کشف قیمت'
                                    }
                                </p>
                            </div>

                            {/* Quick indicator badges for Divar Stats */}
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
                        <div className="h-96 sm:h-[450px] w-full pt-2">
                            {(divarScatterData.length > 0 || otherSourcesScatterData.length > 0) ? (
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
                                                value: 'شماره آگهی دیوار و توزیع مراجع بازار', 
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

                                                // External Market Source Tooltip
                                                if (d.isOtherSource) {
                                                    return (
                                                        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 shadow-2xl text-xs space-y-2 font-sans max-w-xs z-50">
                                                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                                                                <span className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                                                                    <span className="text-base" style={{ color: d.color }}>{d.markerSymbol}</span>
                                                                    <span>{d.sourceLabel}</span>
                                                                </span>
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                                                    مرجع بازار
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[11px] text-slate-400">مدل استعلام‌شده:</span>
                                                                <p className="font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                                                    {d.modelName}
                                                                </p>
                                                            </div>
                                                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                                <div className="flex justify-between items-center text-xs font-bold">
                                                                    <span className="text-slate-500">نرخ ثبت‌شده:</span>
                                                                    <span className="font-mono text-sm font-black" style={{ color: d.color }}>
                                                                        {d.price.toLocaleString('fa-IR')} تومان
                                                                    </span>
                                                                </div>
                                                                {d.diffWithDivarAvg !== undefined && (
                                                                    <div className="flex justify-between items-center text-[11px] mt-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                                                                        <span className="text-slate-400">اختلاف با میانگین دیوار:</span>
                                                                        <span className={`font-mono font-bold ${
                                                                            d.diffWithDivarAvg > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                                        }`}>
                                                                            {d.diffWithDivarAvg > 0 ? `+${d.diffWithDivarAvg}٪ بالاتر` : `${Math.abs(d.diffWithDivarAvg)}٪ پایین‌تر`}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {d.capturedAt && (
                                                                <p className="text-[10px] text-slate-400 font-mono text-left">
                                                                    زمان ثبت: {d.capturedAt}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Divar Ad Tooltip
                                                return (
                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1.5 font-sans max-w-xs z-50">
                                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                                                            <span className="font-mono text-slate-400 text-[10px]">آگهی دیوار #{d.index}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                                d.isOutlier
                                                                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200'
                                                                    : d.isMax 
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
                                                    value: `🔺 سقف دیوار: ${activeCarStats.maxPrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#10b981', 
                                                    fontSize: 10.5, 
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
                                                    value: `⚖️ میانگین دیوار: ${activeCarStats.avgPrice.toLocaleString('fa-IR')} تومان`, 
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
                                                    value: `🔁 نرخ پرتکرار دیوار (${activeCarStats.modeCount} آگهی): ${activeCarStats.modePrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#8b5cf6', 
                                                    fontSize: 10.5, 
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
                                                    value: `🔻 کف دیوار: ${activeCarStats.minPrice.toLocaleString('fa-IR')} تومان`, 
                                                    fill: '#f43f5e', 
                                                    fontSize: 10.5, 
                                                    position: 'bottom',
                                                    fontFamily: 'Vazirmatn'
                                                }} 
                                            />
                                        )}

                                        {/* Reference Lines for Other Sources */}
                                        {showOtherSourceLines && otherSourcesScatterData.map((src, i) => (
                                            <ReferenceLine
                                                key={`ref-line-${src.sourceName}-${i}`}
                                                y={src.price}
                                                stroke={src.color}
                                                strokeDasharray="5 5"
                                                strokeWidth={1.5}
                                                opacity={0.7}
                                                label={{
                                                    value: `${src.markerSymbol} ${src.sourceLabel.split('(')[0].trim()}: ${formatPriceShort(src.price)}`,
                                                    fill: src.color,
                                                    fontSize: 9.5,
                                                    position: 'insideBottomRight',
                                                    fontFamily: 'Vazirmatn'
                                                }}
                                            />
                                        ))}

                                        {/* Scatter Series 1: Divar Ads */}
                                        <Scatter name="آگهی‌های دیوار" data={divarScatterData} shape="circle">
                                            {divarScatterData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-divar-${index}`} 
                                                    fill={entry.color} 
                                                />
                                            ))}
                                        </Scatter>

                                        {/* Scatter Series 2: Other Sources With Distinct Custom Markers */}
                                        {otherSourcesScatterData.length > 0 && (
                                            <Scatter 
                                                name="سایر منابع بازار" 
                                                data={otherSourcesScatterData} 
                                                shape={renderOtherSourceShape}
                                            />
                                        )}
                                    </ScatterChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-10">
                                    <Info className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                                    <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                                        هیچ قیمت پیش‌فرضی ثبت نشده است
                                    </span>
                                    <p className="text-slate-400 text-xs mt-1 max-w-sm text-center">
                                        برای جلوگیری از نمایش اعداد منقضی، کلیه قیمت‌ها مستقیماً و برخط از دیوار استعلام می‌شوند.
                                    </p>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => handleQueryDivar(selectedCar, activeCity)}
                                        className="mt-3.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-200 dark:shadow-none"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>استعلام زنده {activeCarStats.displayName} در {activeCityObj.label}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Extended Legend & Marker Guide Bar */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                <span className="text-[11px] text-slate-400 font-bold ml-1">راهنمای نشانگرها:</span>
                                
                                {/* Divar Indicators */}
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span>
                                    <span>سقف دیوار</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs"></span>
                                    <span>میانگین دیوار</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span>
                                    <span>پرتکرار دیوار</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span>
                                    <span>کف دیوار</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                                    <span>سایر آگهی‌های دیوار</span>
                                </div>
                                {!isNormalized && normalizationAnalysis.outlierCount > 0 && (
                                    <div className="flex items-center gap-1.5 text-orange-600 font-black">
                                        <span className="w-3 h-3 rounded-full bg-orange-600 shadow-xs"></span>
                                        <span>آگهی‌های غیرمتعارف (۵۰٪±)</span>
                                    </div>
                                )}
                            </div>

                            {/* Other Market Sources Markers Legend */}
                            {otherSourcesScatterData.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-xs">
                                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 ml-1">
                                        نشانگرهای مثلثی سایر مراجع در نمودار:
                                    </span>
                                    {otherSourcesScatterData.map(src => (
                                        <div 
                                            key={`legend-${src.sourceName}-${src.modelName}`}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                        >
                                            <span className="text-sm font-black" style={{ color: src.color }}>
                                                ▲
                                            </span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                {src.sourceLabel.split('(')[0].trim()}
                                            </span>
                                            <span className="font-mono text-slate-500 text-[10px]">
                                                ({formatPriceShort(src.price)})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* قیمت‌های استعلام‌شده از سایر مراجع بازار - نمایش در پایین نمودار */}
                        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-200/60 dark:border-indigo-800/60">
                                        ▲
                                    </span>
                                    <h4 className="font-black text-slate-800 dark:text-white text-sm">
                                        قیمت‌های استعلام‌شده از سایر مراجع بازار
                                    </h4>
                                    <span className="text-[11px] font-bold text-slate-400">
                                        (با نشانگر مثلثی ▲ و نام مرجع در نمودار)
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                                    {allMatchedOtherSources.length > 0 
                                        ? `${allMatchedOtherSources.length.toLocaleString('fa-IR')} مرجع استعلام‌شده برای ${activeCarStats.displayName}` 
                                        : 'بدون داده تطبیقی سایر مراجع'}
                                </span>
                            </div>

                            {allMatchedOtherSources.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                    {allMatchedOtherSources.map((src) => (
                                        <div
                                            key={`bottom-card-${src.sourceName}-${src.modelName}`}
                                            className={`p-3.5 rounded-2xl border transition-all hover:shadow-md ${src.bgClass} ${src.borderClass} flex flex-col justify-between gap-2.5`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0"
                                                        style={{ backgroundColor: src.color }}
                                                    >
                                                        ▲
                                                    </span>
                                                    <div>
                                                        <span className={`font-black text-xs ${src.textClass}`}>
                                                            {src.sourceLabel}
                                                        </span>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                            {src.modelName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                                                    مرجع بازار
                                                </span>
                                            </div>

                                            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                    قیمت استعلام‌شده:
                                                </span>
                                                <div className="text-left">
                                                    <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white" style={{ color: src.color }}>
                                                        {src.price.toLocaleString('fa-IR')}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500 mr-1">
                                                        تومان
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    نسبت به میانگین دیوار:
                                                </span>
                                                {src.diffWithDivarAvg !== undefined ? (
                                                    <span className={`px-2 py-0.5 rounded-lg font-mono font-black ${
                                                        src.diffWithDivarAvg > 0
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                                            : src.diffWithDivarAvg < 0
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                        {src.diffWithDivarAvg > 0 
                                                            ? `+${src.diffWithDivarAvg}٪ بالاتر` 
                                                            : src.diffWithDivarAvg < 0 
                                                            ? `${src.diffWithDivarAvg}٪ مناسب‌تر` 
                                                            : 'برابر'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>

                                            {src.capturedAt && (
                                                <div className="text-[10px] text-slate-400 font-mono text-left pt-1 border-t border-dashed border-slate-200/40 dark:border-slate-800/40">
                                                    زمان ثبت: {src.capturedAt}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-400">
                                    در حال حاضر برای خودروی <strong className="text-slate-700 dark:text-slate-300 font-bold">{activeCarStats.displayName}</strong> قیمت تطبیق‌یافته‌ای در سایر مراجع استعلام نشده است.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Table of Ads for Selected Car */}
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
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
                                {isNormalized && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                                        نرمال‌شده
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                                <div className="relative flex-1 sm:w-60">
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="جستجو در عنوان یا توضیحات آگهی..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-3 pr-9 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOnlyZeroKm(!onlyZeroKm)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        onlyZeroKm
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    فقط صفر کیلومتر
                                </button>

                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
                                    <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
                                    <option value="km_asc">کمترین کارکرد</option>
                                </select>
                            </div>
                        </div>

                        {/* Ads Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-750">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                        <th className="p-3 w-12 text-center">#</th>
                                        <th className="p-3">عنوان آگهی</th>
                                        <th className="p-3 text-center">قیمت اعلامی (تومان)</th>
                                        <th className="p-3 text-center">وضعیت نسبت به بازه</th>
                                        <th className="p-3 text-center">کارکرد</th>
                                        <th className="p-3">توضیحات و مشخصات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tableAds.length > 0 ? (
                                        tableAds.map((ad, idx) => {
                                            const isMax = ad.price === activeCarStats.maxPrice;
                                            const isMin = ad.price === activeCarStats.minPrice;
                                            const isMode = ad.price === activeCarStats.modePrice;
                                            const outlierInfo = normalizationAnalysis.outlierAds.find(o => o.ad === ad);

                                            return (
                                                <tr 
                                                    key={idx} 
                                                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                        !isNormalized && outlierInfo ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                                                    }`}
                                                >
                                                    <td className="p-3 text-center font-mono text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-black text-slate-800 dark:text-slate-200">
                                                            {ad.title || 'بدون عنوان'}
                                                        </div>
                                                        {ad.href && (
                                                            <a 
                                                                href={ad.href} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline mt-0.5 inline-flex items-center gap-0.5"
                                                            >
                                                                <span>مشاهده آگهی در دیوار</span>
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center font-mono font-bold text-sm">
                                                        {typeof ad.price === 'number' && ad.price > 0 ? (
                                                            <span className={`${
                                                                isMax 
                                                                    ? 'text-emerald-600 dark:text-emerald-400 font-black' 
                                                                    : isMin 
                                                                    ? 'text-rose-600 dark:text-rose-400 font-black'
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
                                                        {!isNormalized && outlierInfo ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 font-black border border-orange-300 dark:border-orange-800">
                                                                {outlierInfo.reason === 'too_low' 
                                                                    ? `پرت (${outlierInfo.deviationPct}٪- پایین)` 
                                                                    : `پرت (${outlierInfo.deviationPct}٪+ بالا)`}
                                                            </span>
                                                        ) : isMax ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                                                سقف قیمت 🔺
                                                            </span>
                                                        ) : isMin ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                                                                کف قیمت 🔻
                                                            </span>
                                                        ) : isMode && !isMax && !isMin ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                                                پرتکرارترین 🔁
                                                            </span>
                                                        ) : typeof ad.price === 'number' && ad.price > 0 ? (
                                                            <span className="text-[10px] text-slate-400">
                                                                درون بازه
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
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
                                            <td colSpan={6} className="p-10 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Info className="w-6 h-6 text-slate-400" />
                                                    <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                                                        هیچ آگهی با فیلترهای انتخابی یافت نشد.
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outliers Detail Modal */}
            {showOutliersModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 dark:text-white text-sm">
                                        آگهی‌های غیرمتعارف فیلترشده (انحراف ۵۰٪±)
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        مبنای اکثر قیمت‌ها: {normalizationAnalysis.majorityPrice.toLocaleString('fa-IR')} تومان
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOutliersModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                            <p className="font-bold">قاعده نرمال‌سازی سیستم:</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                بر اساس قاعده تعریف‌شده، قیمت‌هایی که بیش از ۵۰٪ کمتر از نرخ پرتکرار (پیش‌پرداخت/وام) یا بیش از ۵۰٪ بالاتر از آن (اشتباه تایپی/قیمت کاذب) باشند، از محاسبات آماری نرمال حذف شده‌اند.
                            </p>
                            <div className="flex justify-between items-center text-[11px] font-mono pt-1 text-rose-600 dark:text-rose-400 font-bold">
                                <span>کف مجاز معتبر: {normalizationAnalysis.minAllowed.toLocaleString('fa-IR')} ت</span>
                                <span>سقف مجاز معتبر: {normalizationAnalysis.maxAllowed.toLocaleString('fa-IR')} ت</span>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                            {normalizationAnalysis.outlierAds.map((item, idx) => (
                                <div 
                                    key={idx}
                                    className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                                            {item.ad.title || 'بدون عنوان'}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0">
                                            {item.reason === 'too_low' ? `انحراف ۵۰٪- (کف غیرمتعارف)` : `انحراف ۵۰٪+ (سقف غیرمتعارف)`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-1 font-mono">
                                        <span className="text-slate-500">قیمت درج‌شده در آگهی:</span>
                                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                                            {item.ad.price.toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        کارکرد: {item.ad.km === '0' ? 'صفر کیلومتر' : `${item.ad.km} ک.م`}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsNormalized(false);
                                    setShowOutliersModal(false);
                                }}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                            >
                                سوئیچ به نمودار غیرنرمال (دیدن همه)
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOutliersModal(false)}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DivarPriceAnalysisSection;
