import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
    TrendingUp, 
    ArrowRightLeft, 
    Truck, 
    ShieldCheck, 
    AlertTriangle, 
    Calculator, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    RefreshCw, 
    Layers, 
    Building2, 
    MapPin, 
    Sparkles, 
    Clock, 
    Car, 
    Info, 
    Radio
} from 'lucide-react';
import { 
    ArbitrageCityKey, 
    ARBITRAGE_CITIES_CONFIG, 
    CarArbitrageOpportunity, 
    CityPriceSummary,
    CityInquiryMeta,
    CustomCalculatorInput
} from '../types/carArbitrage';
import { 
    KNOWN_ARBITRAGE_CARS, 
    generateArbitrageOpportunities, 
    formatToman, 
    formatTomanMillion, 
    calculateCustomDeal, 
    formatInquiryTimeAgo
} from '../services/carArbitrageService';
import { getDivarPrices } from '../services/api';
import type { DivarPriceItem, ScrapedCarPrice, CarPriceStats } from '../types';

interface CarArbitrageSectionProps {
    divarListings?: DivarPriceItem[];
    scrapedPrices?: ScrapedCarPrice[];
    priceStats?: CarPriceStats[];
    onRefresh?: () => void;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

export const CarArbitrageSection: React.FC<CarArbitrageSectionProps> = ({
    divarListings: propDivarListings = [],
    scrapedPrices = [],
    priceStats = [],
    onRefresh,
    showToast
}) => {
    // State filters
    const [selectedCarFilter, setSelectedCarFilter] = useState<string>('all');
    const [selectedOriginFilter, setSelectedOriginFilter] = useState<string>('all');
    const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'profit' | 'roi' | 'risk' | 'distance'>('profit');
    const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

    // Active Tab inside Arbitrage Section
    const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'calculator' | 'matrix'>('opportunities');

    // Selected Target City for Inquiry (all or specific city)
    const [selectedInquiryCity, setSelectedInquiryCity] = useState<'all' | ArbitrageCityKey>('shiraz');

    // Live Divar Inquiries per City State (NO OFFLINE CACHE - ALWAYS LIVE)
    const [cityLiveListings, setCityLiveListings] = useState<Record<ArbitrageCityKey, DivarPriceItem[]>>({
        shiraz: [],
        tehran: [],
        isfahan: [],
        bushehr: []
    });

    // Inquiry Metadata per City (Timestamps, counts, status)
    const [cityInquiryMeta, setCityInquiryMeta] = useState<Record<ArbitrageCityKey, CityInquiryMeta>>({
        shiraz: { cityKey: 'shiraz', cityLabel: 'شیراز (دفتر مرکزی)', lastInquiredAt: null, timeAgoText: 'استعلام نشده', rawAdsCount: 0, validAdsCount: 0, outlierAdsCount: 0, status: 'idle' },
        tehran: { cityKey: 'tehran', cityLabel: 'تهران', lastInquiredAt: null, timeAgoText: 'استعلام نشده', rawAdsCount: 0, validAdsCount: 0, outlierAdsCount: 0, status: 'idle' },
        isfahan: { cityKey: 'isfahan', cityLabel: 'اصفهان', lastInquiredAt: null, timeAgoText: 'استعلام نشده', rawAdsCount: 0, validAdsCount: 0, outlierAdsCount: 0, status: 'idle' },
        bushehr: { cityKey: 'bushehr', cityLabel: 'بوشهر', lastInquiredAt: null, timeAgoText: 'استعلام نشده', rawAdsCount: 0, validAdsCount: 0, outlierAdsCount: 0, status: 'idle' }
    });

    // Inquiry status and timers
    const [isInquiring, setIsInquiring] = useState<boolean>(false);
    const [activeInquiringCity, setActiveInquiringCity] = useState<ArbitrageCityKey | null>(null);
    const [inquiryElapsedSeconds, setInquiryElapsedSeconds] = useState<number>(0);
    const [lastGlobalInquiryTime, setLastGlobalInquiryTime] = useState<string | null>(null);

    // 50-second Countdown State between cities
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [nextCityInQueue, setNextCityInQueue] = useState<ArbitrageCityKey | null>(null);
    const [justCompletedCity, setJustCompletedCity] = useState<ArbitrageCityKey | null>(null);
    const [isSequentialRunning, setIsSequentialRunning] = useState<boolean>(false);

    // Normalization View Mode
    const [showNormalizationDetails, setShowNormalizationDetails] = useState<boolean>(false);

    // Abort Controller and Timers for Live Inquiries
    const abortControllerRef = useRef<AbortController | null>(null);
    const elapsedTimerRef = useRef<any>(null);
    const countdownIntervalRef = useRef<any>(null);
    const skipCountdownResolverRef = useRef<(() => void) | null>(null);
    const stopSequenceFlagRef = useRef<boolean>(false);
    const relativeTimeIntervalRef = useRef<any>(null);

    // Calculator State (Default initial values will populate from live data if available)
    const [calcCarKey, setCalcCarKey] = useState<string>('kmc eagle');
    const [calcOrigin, setCalcOrigin] = useState<ArbitrageCityKey>('tehran');
    const [calcBuyPrice, setCalcBuyPrice] = useState<number>(0);
    const [calcSellPrice, setCalcSellPrice] = useState<number>(0);
    const [calcCarrierCost, setCalcCarrierCost] = useState<number>(15_000_000);
    const [calcInspectionCost, setCalcInspectionCost] = useState<number>(4_000_000);
    const [calcExtraCost, setCalcExtraCost] = useState<number>(0);
    const [calcDays, setCalcDays] = useState<number>(2.5);

    // Relative Time Updater (every 15 seconds)
    useEffect(() => {
        const updateRelativeTimes = () => {
            setCityInquiryMeta(prev => {
                const next = { ...prev };
                (Object.keys(next) as ArbitrageCityKey[]).forEach(cityKey => {
                    const item = next[cityKey];
                    if (item && item.lastInquiredAt) {
                        next[cityKey] = {
                            ...item,
                            timeAgoText: formatInquiryTimeAgo(item.lastInquiredAt)
                        };
                    }
                });
                return next;
            });
        };

        relativeTimeIntervalRef.current = setInterval(updateRelativeTimes, 15000);
        return () => {
            if (relativeTimeIntervalRef.current) clearInterval(relativeTimeIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        };
    }, []);

    // Helper: Stop/Cancel all active inquiries & countdowns
    const stopAllInquiries = useCallback(() => {
        stopSequenceFlagRef.current = true;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (elapsedTimerRef.current) {
            clearInterval(elapsedTimerRef.current);
            elapsedTimerRef.current = null;
        }
        if (skipCountdownResolverRef.current) {
            skipCountdownResolverRef.current();
            skipCountdownResolverRef.current = null;
        }
        setIsInquiring(false);
        setActiveInquiringCity(null);
        setCountdownSeconds(0);
        setNextCityInQueue(null);
        setIsSequentialRunning(false);
    }, []);

    // 1. Inquire a Single City on-demand
    const handleInquireSingleCity = useCallback(async (cityKey: ArbitrageCityKey, targetCarKey?: string): Promise<boolean> => {
        stopAllInquiries();
        stopSequenceFlagRef.current = false;

        const carQuery = targetCarKey && targetCarKey !== 'all' ? targetCarKey : (selectedCarFilter !== 'all' ? selectedCarFilter : 'kmc eagle');
        const carLabel = KNOWN_ARBITRAGE_CARS.find(c => c.key === carQuery)?.label || carQuery;
        const cityLabel = ARBITRAGE_CITIES_CONFIG[cityKey].label.split(' ')[0];

        setIsInquiring(true);
        setActiveInquiringCity(cityKey);
        setInquiryElapsedSeconds(0);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        elapsedTimerRef.current = setInterval(() => {
            setInquiryElapsedSeconds(s => s + 1);
        }, 1000);

        setCityInquiryMeta(prev => ({
            ...prev,
            [cityKey]: { ...prev[cityKey], status: 'loading', errorMessage: null }
        }));

        try {
            const rawItems = await getDivarPrices(carQuery, cityKey, controller.signal);
            const nowIso = new Date().toISOString();
            const items = Array.isArray(rawItems) ? rawItems : [];
            const labeled = items.map(i => ({ ...i, car_name: i.car_name || carQuery }));

            setCityLiveListings(prev => ({
                ...prev,
                [cityKey]: labeled
            }));

            const rawCount = items.length;
            const validCount = items.filter(i => typeof i.price === 'number' && i.price > 100_000_000).length;
            const outlierCount = Math.max(0, rawCount - validCount);

            setCityInquiryMeta(prev => ({
                ...prev,
                [cityKey]: {
                    cityKey,
                    cityLabel: ARBITRAGE_CITIES_CONFIG[cityKey].label,
                    lastInquiredAt: nowIso,
                    timeAgoText: formatInquiryTimeAgo(nowIso),
                    rawAdsCount: rawCount,
                    validAdsCount: validCount,
                    outlierAdsCount: outlierCount,
                    status: 'success',
                    errorMessage: null
                }
            }));

            setLastGlobalInquiryTime(nowIso);

            if (showToast) {
                showToast(`استعلام زنده شهر ${cityLabel} برای ${carLabel} انجام شد (${validCount} آگهی معتبر)`, 'success');
            }
            return true;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setCityInquiryMeta(prev => ({
                    ...prev,
                    [cityKey]: {
                        ...prev[cityKey],
                        status: 'error',
                        errorMessage: err?.message || 'خطا در استعلام'
                    }
                }));
                if (showToast) {
                    showToast(`خطا در استعلام قیمت ${cityLabel}: ${err?.message || ''}`, 'error');
                }
            }
            return false;
        } finally {
            setIsInquiring(false);
            setActiveInquiringCity(null);
            if (elapsedTimerRef.current) {
                clearInterval(elapsedTimerRef.current);
                elapsedTimerRef.current = null;
            }
            abortControllerRef.current = null;
        }
    }, [selectedCarFilter, showToast, stopAllInquiries]);

    // 2. Sequential Inquiry for multiple cities with a strict 50-second gap between cities
    const handleFetchSequentialCitiesLive = useCallback(async (targetCarKey?: string) => {
        stopAllInquiries();
        stopSequenceFlagRef.current = false;
        setIsSequentialRunning(true);

        const carQuery = targetCarKey && targetCarKey !== 'all' ? targetCarKey : (selectedCarFilter !== 'all' ? selectedCarFilter : 'kmc eagle');
        const cities: ArbitrageCityKey[] = ['shiraz', 'tehran', 'isfahan', 'bushehr'];

        for (let i = 0; i < cities.length; i++) {
            if (stopSequenceFlagRef.current) break;

            const currentCity = cities[i];
            setActiveInquiringCity(currentCity);
            setIsInquiring(true);
            setInquiryElapsedSeconds(0);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
            elapsedTimerRef.current = setInterval(() => {
                setInquiryElapsedSeconds(s => s + 1);
            }, 1000);

            setCityInquiryMeta(prev => ({
                ...prev,
                [currentCity]: { ...prev[currentCity], status: 'loading', errorMessage: null }
            }));

            try {
                const rawItems = await getDivarPrices(carQuery, currentCity, controller.signal);
                const nowIso = new Date().toISOString();
                const items = Array.isArray(rawItems) ? rawItems : [];
                const labeled = items.map(item => ({ ...item, car_name: item.car_name || carQuery }));

                setCityLiveListings(prev => ({
                    ...prev,
                    [currentCity]: labeled
                }));

                const rawCount = items.length;
                const validCount = items.filter(item => typeof item.price === 'number' && item.price > 100_000_000).length;
                const outlierCount = Math.max(0, rawCount - validCount);

                setCityInquiryMeta(prev => ({
                    ...prev,
                    [currentCity]: {
                        cityKey: currentCity,
                        cityLabel: ARBITRAGE_CITIES_CONFIG[currentCity].label,
                        lastInquiredAt: nowIso,
                        timeAgoText: formatInquiryTimeAgo(nowIso),
                        rawAdsCount: rawCount,
                        validAdsCount: validCount,
                        outlierAdsCount: outlierCount,
                        status: 'success',
                        errorMessage: null
                    }
                }));

                setLastGlobalInquiryTime(nowIso);
                setJustCompletedCity(currentCity);

                if (showToast) {
                    const cLabel = ARBITRAGE_CITIES_CONFIG[currentCity].label.split(' ')[0];
                    showToast(`استعلام زنده ${cLabel} با موفقیت انجام شد (${validCount} آگهی)`, 'success');
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setCityInquiryMeta(prev => ({
                        ...prev,
                        [currentCity]: {
                            ...prev[currentCity],
                            status: 'error',
                            errorMessage: err?.message || 'خطا در استعلام'
                        }
                    }));
                }
            } finally {
                setIsInquiring(false);
                setActiveInquiringCity(null);
                if (elapsedTimerRef.current) {
                    clearInterval(elapsedTimerRef.current);
                    elapsedTimerRef.current = null;
                }
                abortControllerRef.current = null;
            }

            // If there's another city in the queue, wait 50 seconds before inquiring the next one!
            if (i < cities.length - 1 && !stopSequenceFlagRef.current) {
                const nextCity = cities[i + 1];
                setNextCityInQueue(nextCity);
                setCountdownSeconds(50);

                await new Promise<void>((resolve) => {
                    skipCountdownResolverRef.current = resolve;
                    let remaining = 50;

                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = setInterval(() => {
                        remaining -= 1;
                        setCountdownSeconds(remaining);
                        if (remaining <= 0 || stopSequenceFlagRef.current) {
                            if (countdownIntervalRef.current) {
                                clearInterval(countdownIntervalRef.current);
                                countdownIntervalRef.current = null;
                            }
                            setCountdownSeconds(0);
                            setNextCityInQueue(null);
                            skipCountdownResolverRef.current = null;
                            resolve();
                        }
                    }, 1000);
                });
            }
        }

        setIsSequentialRunning(false);
        setCountdownSeconds(0);
        setNextCityInQueue(null);
        setJustCompletedCity(null);
    }, [selectedCarFilter, showToast, stopAllInquiries]);

    // Skip the 50-second countdown immediately and trigger next city right away
    const handleSkipCountdown = () => {
        if (skipCountdownResolverRef.current) {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
            setCountdownSeconds(0);
            skipCountdownResolverRef.current();
            skipCountdownResolverRef.current = null;
        }
    };

    // Main Inquire trigger based on user choice
    const handleExecuteInquiry = () => {
        if (selectedInquiryCity === 'all') {
            handleFetchSequentialCitiesLive();
        } else {
            handleInquireSingleCity(selectedInquiryCity);
        }
    };

    // Initial Live Inquiry on mount:
    // By default, as soon as the opportunities section opens, automatically inquire Shiraz for the selected car!
    useEffect(() => {
        handleInquireSingleCity('shiraz', 'kmc eagle');
    }, []);

    // Generate Opportunities & City Summaries with strict statistical normalization
    // ONLY uses live inquired listings
    const { opportunities, citySummariesByCar } = useMemo(() => {
        return generateArbitrageOpportunities({
            cityLiveListings,
            divarListings: propDivarListings,
            scrapedPrices,
            priceStats,
            selectedCarKey: selectedCarFilter
        });
    }, [cityLiveListings, propDivarListings, scrapedPrices, priceStats, selectedCarFilter]);

    // Update Calculator default values when live summaries become available
    useEffect(() => {
        const carSummary = citySummariesByCar[calcCarKey];
        if (carSummary) {
            const originSum = carSummary[calcOrigin];
            const shirazSum = carSummary['shiraz'];
            if (originSum && originSum.effectiveBuyPriceToman > 0 && calcBuyPrice === 0) {
                setCalcBuyPrice(originSum.effectiveBuyPriceToman);
            }
            if (shirazSum && shirazSum.effectiveSellPriceToman > 0 && calcSellPrice === 0) {
                setCalcSellPrice(shirazSum.effectiveSellPriceToman);
            }
        }
    }, [citySummariesByCar, calcCarKey, calcOrigin, calcBuyPrice, calcSellPrice]);

    // Filter and sort opportunities
    const filteredOpportunities = useMemo(() => {
        let list = [...opportunities];

        if (selectedCarFilter !== 'all') {
            list = list.filter(o => o.carKey === selectedCarFilter);
        }

        if (selectedOriginFilter !== 'all') {
            list = list.filter(o => o.originCity === selectedOriginFilter);
        }

        if (selectedRiskFilter !== 'all') {
            if (selectedRiskFilter === 'low_only') {
                list = list.filter(o => o.riskLevel === 'LOW');
            } else if (selectedRiskFilter === 'profitable_only') {
                list = list.filter(o => o.netProfitToman > 0);
            } else if (selectedRiskFilter === 'strong_only') {
                list = list.filter(o => o.signal === 'STRONG_BUY');
            }
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'profit') return b.netProfitToman - a.netProfitToman;
            if (sortBy === 'roi') return b.roiPercent - a.roiPercent;
            if (sortBy === 'risk') return a.riskScore - b.riskScore;
            if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
            return 0;
        });

        return list;
    }, [opportunities, selectedCarFilter, selectedOriginFilter, selectedRiskFilter, sortBy]);

    // High level metrics
    const summaryMetrics = useMemo(() => {
        const profitable = opportunities.filter(o => o.netProfitToman > 0);
        const maxProfit = opportunities.length > 0 ? Math.max(...opportunities.map(o => o.netProfitToman)) : 0;
        const avgRoi = profitable.length > 0 
            ? Number((profitable.reduce((s, o) => s + o.roiPercent, 0) / profitable.length).toFixed(1))
            : 0;
        const totalEvaluatedAds = (Object.values(cityInquiryMeta) as CityInquiryMeta[]).reduce((s, c) => s + (c.rawAdsCount || 0), 0);

        return {
            totalOpportunities: opportunities.length,
            profitableCount: profitable.length,
            maxProfit,
            avgRoi,
            totalEvaluatedAds
        };
    }, [opportunities, cityInquiryMeta]);

    // Calculate dynamic custom deal from calculator inputs
    const customDealResult = useMemo(() => {
        const input: CustomCalculatorInput = {
            carKey: calcCarKey,
            originCity: calcOrigin,
            buyPriceToman: calcBuyPrice,
            sellPriceShirazToman: calcSellPrice,
            carrierCostToman: calcCarrierCost,
            inspectionCostToman: calcInspectionCost,
            additionalCostsToman: calcExtraCost,
            estimatedDays: calcDays
        };
        return calculateCustomDeal(input);
    }, [calcCarKey, calcOrigin, calcBuyPrice, calcSellPrice, calcCarrierCost, calcInspectionCost, calcExtraCost, calcDays]);

    // Handle Quick Load of Opportunity into Calculator
    const handleLoadIntoCalculator = (op: CarArbitrageOpportunity) => {
        setCalcCarKey(op.carKey);
        setCalcOrigin(op.originCity);
        setCalcBuyPrice(op.buyPriceToman);
        setCalcSellPrice(op.sellPriceShirazToman);
        setCalcCarrierCost(op.carrierCostToman);
        setCalcInspectionCost(op.inspectionCostToman);
        setCalcExtraCost(0);
        setCalcDays(op.estimatedDays);
        setActiveSubTab('calculator');
        if (showToast) {
            showToast(`اطلاعات معامله ${op.carName} در ماشین‌حساب بارگذاری شد.`, 'success');
        }
    };

    // Copy Opportunity text to clipboard
    const handleCopyOpportunity = (op: CarArbitrageOpportunity) => {
        const text = `📊 تحلیل فرصت خرید و آربیتراژ خودرو (نرمال‌سازی شده برخط)
🏷️ مدل خودرو: ${op.carName}
📍 مبدأ خرید: ${op.originCityLabel}
🏢 مقصد فروش: شیراز (دفتر مرکزی نمایندگی)
💰 قیمت خرید نرمال در مبدأ: ${formatToman(op.buyPriceToman)}
🚚 هزینه خودروبر و حمل: ${formatToman(op.carrierCostToman)}
🔍 هزینه کارشناسی و محضر: ${formatToman(op.inspectionCostToman)}
💵 بهای تمام‌شده کل: ${formatToman(op.totalCapitalRequiredToman)}
🏷️ قیمت فروش مصوب در شیراز: ${formatToman(op.sellPriceShirazToman)}
💎 سود خالص پیش‌بینی‌شده: ${formatToman(op.netProfitToman)} (${op.roiPercent > 0 ? '+' : ''}${op.roiPercent}٪ بازده سرمایه)
🛡️ وضعیت ریسک جابجایی: ${op.riskLevel === 'LOW' ? 'کم‌ریسک 🟢' : op.riskLevel === 'MEDIUM' ? 'ریسک متوسط 🟡' : 'پرریسک 🔴'} (شاخص: ${op.riskScore}/100)
⏱️ زمان تخمینی جابجایی: ${op.estimatedDays} روز
📝 خلاصه راهبرد: ${op.actionSummary}
🕒 زمان استعلام: ${formatInquiryTimeAgo(lastGlobalInquiryTime)}
📅 مرجع تحلیل: حسینی خودرو شیراز`;

        navigator.clipboard.writeText(text);
        setCopiedCardId(op.id);
        setTimeout(() => setCopiedCardId(null), 2500);
        if (showToast) {
            showToast('تحلیل فرصت معامله کپی شد', 'success');
        }
    };

    // Auto-update default prices when changing car/origin in calculator
    const handleCalculatorCarChange = (newCarKey: string) => {
        setCalcCarKey(newCarKey);
        const carSummary = citySummariesByCar[newCarKey];
        if (carSummary) {
            const originSum = carSummary[calcOrigin];
            const shirazSum = carSummary['shiraz'];
            if (originSum && originSum.effectiveBuyPriceToman > 0) setCalcBuyPrice(originSum.effectiveBuyPriceToman);
            if (shirazSum && shirazSum.effectiveSellPriceToman > 0) setCalcSellPrice(shirazSum.effectiveSellPriceToman);
        }
    };

    const handleCalculatorOriginChange = (newOrigin: ArbitrageCityKey) => {
        setCalcOrigin(newOrigin);
        const config = ARBITRAGE_CITIES_CONFIG[newOrigin];
        setCalcCarrierCost(config.defaultCarrierCostToman);
        setCalcInspectionCost(config.defaultInspectionCostToman);
        setCalcDays(config.estimatedTransportDays);

        const carSummary = citySummariesByCar[calcCarKey];
        if (carSummary && carSummary[newOrigin] && carSummary[newOrigin].effectiveBuyPriceToman > 0) {
            setCalcBuyPrice(carSummary[newOrigin].effectiveBuyPriceToman);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Overview & Live Control Center */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/40 shadow-xl relative overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    {/* Quick Stats Summary & Live Refresh Trigger */}
                    <div className="flex flex-wrap items-center gap-3 w-full justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block font-medium">حداکثر سود کشف‌شده</span>
                                    <span className="text-sm font-black text-emerald-400 font-mono block">
                                        {summaryMetrics.maxProfit > 0 ? formatToman(summaryMetrics.maxProfit) : 'در انتظار استعلام'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block font-medium">فرصت‌های فعال</span>
                                    <span className="text-sm font-black text-white font-mono block">
                                        {summaryMetrics.profitableCount} از {summaryMetrics.totalOpportunities} مسیر
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Car and City Inquiry Selector & Trigger Action */}
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            {/* Car Selector Field */}
                            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-2 rounded-xl border border-white/10 text-xs">
                                <Car className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-slate-300 font-bold whitespace-nowrap text-[11px]">انتخاب خودرو:</span>
                                <select
                                    value={selectedCarFilter}
                                    onChange={(e) => {
                                        const newCar = e.target.value;
                                        setSelectedCarFilter(newCar);
                                    }}
                                    disabled={isInquiring || isSequentialRunning}
                                    className="bg-transparent border-none text-white font-bold text-xs outline-none cursor-pointer max-w-[150px] sm:max-w-[180px]"
                                >
                                    <option value="all" className="bg-slate-900 text-white">همه خودروها ({KNOWN_ARBITRAGE_CARS.length})</option>
                                    {KNOWN_ARBITRAGE_CARS.map(c => (
                                        <option key={c.key} value={c.key} className="bg-slate-900 text-white">
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* City Selector Field */}
                            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-2 rounded-xl border border-white/10 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-slate-300 font-bold whitespace-nowrap text-[11px]">انتخاب شهر:</span>
                                <select
                                    value={selectedInquiryCity}
                                    onChange={(e) => setSelectedInquiryCity(e.target.value as any)}
                                    disabled={isInquiring || isSequentialRunning}
                                    className="bg-transparent border-none text-white font-bold text-xs outline-none cursor-pointer"
                                >
                                    <option value="shiraz" className="bg-slate-900 text-white">شیراز 📍 (مرجع نمایندگی)</option>
                                    <option value="tehran" className="bg-slate-900 text-white">تهران 🏛️</option>
                                    <option value="isfahan" className="bg-slate-900 text-white">اصفهان 🏛️</option>
                                    <option value="bushehr" className="bg-slate-900 text-white">بوشهر 🌊</option>
                                    <option value="all" className="bg-slate-900 text-white">همه ۴ شهر (نوبتی با ۵۰ ثانیه فاصله)</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleExecuteInquiry}
                                disabled={isInquiring || isSequentialRunning}
                                className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap ${
                                    isInquiring
                                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                                        : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 shadow-emerald-500/20'
                                }`}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isInquiring ? 'animate-spin' : ''}`} />
                                <span>
                                    {isInquiring
                                        ? `در حال استعلام ${activeInquiringCity ? ARBITRAGE_CITIES_CONFIG[activeInquiringCity].label.split(' ')[0] : 'شهر'} (${inquiryElapsedSeconds} ثانیه)...`
                                        : selectedInquiryCity === 'all'
                                            ? 'استعلام نوبتی ۴ شهر (فاصله ۵۰ ثانیه)'
                                            : `استعلام زنده ${ARBITRAGE_CITIES_CONFIG[selectedInquiryCity].label.split(' ')[0]} ⚡`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 50-Second Countdown Active Banner */}
                {countdownSeconds > 0 && nextCityInQueue && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl border border-amber-500/40 backdrop-blur-md animate-fadeIn space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 text-amber-200 font-bold">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-amber-300 font-mono font-black text-sm animate-pulse">
                                    {countdownSeconds}
                                </div>
                                <div>
                                    <span className="block font-black text-white text-xs">
                                        {justCompletedCity ? `استعلام ${ARBITRAGE_CITIES_CONFIG[justCompletedCity].label.split(' ')[0]} انجام شد.` : ''} انتظار ۵۰ ثانیه‌ای برای شهر بعدی:
                                    </span>
                                    <span className="text-[11px] text-amber-200/90 font-medium">
                                        استعلام خودکار <strong className="text-white underline">{ARBITRAGE_CITIES_CONFIG[nextCityInQueue].label.split(' ')[0]}</strong> تا {countdownSeconds} ثانیه دیگر آغاز می‌شود...
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleSkipCountdown}
                                    className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    <span>استعلام فوری بدون صبر</span>
                                    <span>⏩</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={stopAllInquiries}
                                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <span>توقف چرخه</span>
                                    <span>⏹️</span>
                                </button>
                            </div>
                        </div>

                        {/* Visual Progress Bar for 50-Second Countdown */}
                        <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-1000 ease-linear rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, ((50 - countdownSeconds) / 50) * 100))}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Live Inquiry Status Strip (Detailed Timestamps & Interactive City Badges) */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                            <Clock className="w-3.5 h-3.5" />
                            <span>آخرین استعلام:</span>
                            <strong className="font-mono text-white">{formatInquiryTimeAgo(lastGlobalInquiryTime)}</strong>
                        </span>

                        <span className="text-slate-400 text-[11px]">
                            وضعیت شهرها (کلیک جهت استعلام فوری):
                        </span>

                        {/* Interactive City Badges */}
                        {(['shiraz', 'tehran', 'isfahan', 'bushehr'] as ArbitrageCityKey[]).map(ck => {
                            const meta = cityInquiryMeta[ck];
                            const isSucc = meta.status === 'success' || (meta.rawAdsCount > 0);
                            const isThisLoading = activeInquiringCity === ck;
                            const isNextInQueue = nextCityInQueue === ck;

                            return (
                                <button 
                                    key={ck}
                                    type="button"
                                    onClick={() => handleInquireSingleCity(ck)}
                                    disabled={isInquiring}
                                    title={`کلیک برای استعلام اختصاصی ${ARBITRAGE_CITIES_CONFIG[ck].label}`}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                        isThisLoading 
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40 animate-pulse'
                                            : isNextInQueue
                                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                                : isSucc 
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isThisLoading ? 'bg-amber-400 animate-ping' : 'bg-current'}`} />
                                    <span>{ARBITRAGE_CITIES_CONFIG[ck].label.split(' ')[0]}:</span>
                                    <span className="font-mono text-[10px]">
                                        {isThisLoading ? 'در حال دریافت...' : isSucc ? `${meta.validAdsCount} آگهی` : 'استعلام نشده'}
                                    </span>
                                    <RefreshCw className={`w-2.5 h-2.5 opacity-60 hover:opacity-100 ${isThisLoading ? 'animate-spin' : ''}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Normalization Details Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowNormalizationDetails(!showNormalizationDetails)}
                        className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>نرمال‌سازی آماری: فعال ✅</span>
                        {showNormalizationDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {/* Expandable Normalization Info Box */}
                {showNormalizationDetails && (
                    <div className="mt-3 p-4 bg-slate-950/80 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                            <Info className="w-4 h-4" />
                            <span>مکانیزم هوشمند نرمال‌سازی داده‌ها در حسینی خودرو شیراز:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                            <li><strong>استعلام اختصاصی دیوار بر اساس شهر:</strong> آگهی‌ها به تفکیک شهرهای شیراز، تهران، اصفهان و بوشهر به صورت زنده استعلام می‌شوند.</li>
                            <li><strong>فیلتر آگهی‌های اقساطی:</strong> کلیه آگهی‌های دارای مبالغ پیش‌پرداخت یا ناقص (کمتر از ۱۵۰ میلیون تومان) به طور خودکار حذف می‌شوند.</li>
                            <li><strong>حذف داده‌های پرت آماری (Outlier Trimming):</strong> آگهی‌هایی با انحراف قیمتی بیش از ۲۵٪ از میانه بازار فیلتر می‌گردند تا قیمت‌های کاذب یا اشتباهات تایپی روی میانگین اثر نگذارند.</li>
                            <li><strong>محاسبه نرخ پرتکرار (Mode):</strong> دسته‌بندی قیمت‌ها در بازه‌های ۵ میلیون تومانی جهت تعیین نرخ توافق‌شده خریداران و فروشندگان.</li>
                            <li><strong>کف قیمت خرید بهینه:</strong> محاسبه چارک اول (۲۵٪ پایین‌تر معتبر بازار) برای مبادی جهت تضمین خرید زیر قیمت روز.</li>
                        </ul>
                    </div>
                )}

                {/* Sub-tab Navigation */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('opportunities')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeSubTab === 'opportunities'
                                ? 'bg-white text-slate-900 shadow-md font-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>لیست فرصت‌های معاملاتی ({filteredOpportunities.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('calculator')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeSubTab === 'calculator'
                                ? 'bg-white text-slate-900 shadow-md font-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span>ماشین‌حساب و شبیه‌ساز معامله اختصاصی 🧮</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('matrix')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeSubTab === 'matrix'
                                ? 'bg-white text-slate-900 shadow-md font-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>ماتریس مقایسه قیمت ۴ شهر (تهران، شیراز، اصفهان، بوشهر)</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: Opportunities List */}
            {activeSubTab === 'opportunities' && (
                <div className="space-y-6">
                    {/* Filter and Control Bar */}
                    <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Car Select */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                <Car className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">مدل خودرو:</span>
                                <select
                                    value={selectedCarFilter}
                                    onChange={(e) => {
                                        const newCar = e.target.value;
                                        setSelectedCarFilter(newCar);
                                        if (newCar !== 'all') {
                                            if (selectedInquiryCity === 'all') {
                                                handleFetchSequentialCitiesLive(newCar);
                                            } else {
                                                handleInquireSingleCity(selectedInquiryCity, newCar);
                                            }
                                        }
                                    }}
                                    className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                                >
                                    <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">همه مدل‌ها ({KNOWN_ARBITRAGE_CARS.length})</option>
                                    {KNOWN_ARBITRAGE_CARS.map(c => (
                                        <option key={c.key} value={c.key} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                             {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Origin City Select */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">شهر مبدأ:</span>
                                <select
                                    value={selectedOriginFilter}
                                    onChange={(e) => setSelectedOriginFilter(e.target.value)}
                                    className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                                >
                                    <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">همه مبادی</option>
                                    <option value="tehran" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">تهران (۹۲۰ کیلومتر)</option>
                                    <option value="isfahan" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">اصفهان (۴۸۵ کیلومتر)</option>
                                    <option value="bushehr" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">بوشهر (۲۹۵ کیلومتر)</option>
                                    <option value="shiraz" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">درون شیراز (معامله محلی)</option>
                                </select>
                            </div>

                            {/* Risk Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">فیلتر ریسک:</span>
                                <select
                                    value={selectedRiskFilter}
                                    onChange={(e) => setSelectedRiskFilter(e.target.value)}
                                    className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                                >
                                    <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">همه فرصت‌ها</option>
                                    <option value="profitable_only" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">فقط سود خالص مثبت (سودآور)</option>
                                    <option value="strong_only" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">فرصت‌های طلایی 🟢</option>
                                    <option value="low_only" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">فقط کم‌ریسک (Low Risk)</option>
                                </select>
                            </div>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">مرتب‌سازی:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                            >
                                <option value="profit">بیشترین سود خالص (تومان)</option>
                                <option value="roi">بالاترین درصد بازده (ROI %)</option>
                                <option value="risk">کمترین شاخص ریسک</option>
                                <option value="distance">نزدیک‌ترین مسافت حمل</option>
                            </select>
                        </div>
                    </div>

                    {/* Opportunities Grid / Live Empty States */}
                    {isInquiring ? (
                        <div className="bg-white dark:bg-slate-850 p-12 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 text-center space-y-4 shadow-sm">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-spin">
                                <RefreshCw className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {activeInquiringCity 
                                    ? `در حال استعلام برخط آگهی‌های دیوار در ${ARBITRAGE_CITIES_CONFIG[activeInquiringCity].label.split(' ')[0]}...` 
                                    : 'در حال استعلام برخط آگهی‌های دیوار...'}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                در حال اتصال به وب‌سرویس دیوار و استعلام آگهی‌های لحظه‌ای ({inquiryElapsedSeconds} ثانیه). لطفاً شکیبا باشید.
                            </p>
                        </div>
                    ) : filteredOpportunities.length === 0 ? (
                        <div className="bg-white dark:bg-slate-850 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">فرصت آربیتراژی با داده‌های زنده فعلی یافت نشد</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                بر اساس دستورالعمل عدم نمایش قیمت‌های آفلاین و تخمینی، تنها در صورتی که آگهی‌های واقعی استعلام شده باشند فرصت‌ها محاسبه می‌گردند. لطفاً دکمه استعلام زنده را فشار دهید یا مدل خودروی دیگری را انتخاب فرمایید.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleExecuteInquiry}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>
                                        {selectedInquiryCity === 'all'
                                            ? 'استعلام نوبتی ۴ شهر (فاصله ۵۰ ثانیه)'
                                            : `استعلام زنده ${ARBITRAGE_CITIES_CONFIG[selectedInquiryCity].label.split(' ')[0]}`}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInquireSingleCity('shiraz')}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span>استعلام سریع شیراز (مرجع)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredOpportunities.map((op) => {
                                const isProfitable = op.netProfitToman > 0;
                                const isStrong = op.signal === 'STRONG_BUY';

                                return (
                                    <div 
                                        key={op.id}
                                        className={`bg-white dark:bg-slate-850 rounded-3xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden relative ${
                                            isStrong 
                                                ? 'border-emerald-500/60 dark:border-emerald-500/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                                                : isProfitable
                                                    ? 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    : 'border-slate-200/60 dark:border-slate-800 opacity-75'
                                        }`}
                                    >
                                        {/* Top Accent Strip */}
                                        <div className={`h-1.5 w-full ${
                                            isStrong 
                                                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400' 
                                                : isProfitable 
                                                    ? 'bg-gradient-to-r from-indigo-500 to-sky-500' 
                                                    : 'bg-slate-300 dark:bg-slate-700'
                                        }`} />

                                        <div className="p-5 space-y-4 flex-grow">
                                            {/* Header: Car Name & Origin -> Destination */}
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 ${
                                                        isStrong
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : isProfitable
                                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                        {isStrong && <Sparkles className="w-3 h-3 text-emerald-500" />}
                                                        {op.signalLabel}
                                                    </span>

                                                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {op.estimatedDays === 0 ? 'تحویل فوری' : `~${op.estimatedDays} روز`}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                                                    {op.carName}
                                                </h3>

                                                {/* Trade Route */}
                                                <div className="mt-2.5 flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold">
                                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>خرید از {op.originCityLabel}</span>
                                                    </div>
                                                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        <span>فروش در شیراز</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial breakdown */}
                                            <div className="space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                    <span>قیمت خرید نرمال در {op.originCityLabel}:</span>
                                                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                                        {formatToman(op.buyPriceToman)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Truck className="w-3 h-3 text-indigo-500" />
                                                        <span>هزینه حمل خودروبر و کارشناسی:</span>
                                                    </span>
                                                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                                                        {formatToman(op.totalExpensesToman)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                    <span>قیمت فروش مرجع بازار در شیراز:</span>
                                                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                                        {formatToman(op.sellPriceShirazToman)}
                                                    </span>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                                    <span className="font-black text-slate-900 dark:text-white">سود خالص پیش‌بینی‌شده:</span>
                                                    <div className="text-left">
                                                        <span className={`text-base font-black font-mono block ${
                                                            op.netProfitToman > 0 
                                                                ? 'text-emerald-600 dark:text-emerald-400' 
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {formatToman(op.netProfitToman)}
                                                        </span>
                                                        <span className={`text-[10px] font-bold font-mono ${
                                                            op.roiPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                                                        }`}>
                                                            بازده سرمایه: {op.roiPercent > 0 ? '+' : ''}{op.roiPercent}٪
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Risk Level Badge & Factors */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        {op.riskLevel === 'LOW' ? (
                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                        )}
                                                        <span>ارزیابی ریسک جابجایی:</span>
                                                    </span>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-black ${
                                                        op.riskLevel === 'LOW'
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                                            : op.riskLevel === 'MEDIUM'
                                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                                    }`}>
                                                        شاخص ریسک: {op.riskScore}/۱۰۰
                                                    </span>
                                                </div>

                                                {op.riskFactors.length > 0 && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl leading-relaxed">
                                                        💡 {op.riskFactors[0]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Actions Footer */}
                                        <div className="p-4 bg-slate-50/90 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleLoadIntoCalculator(op)}
                                                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
                                            >
                                                <Calculator className="w-3.5 h-3.5" />
                                                <span>شخصی‌سازی در ماشین‌حساب</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleCopyOpportunity(op)}
                                                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-all cursor-pointer"
                                                title="کپی متن تحلیل معامله"
                                            >
                                                {copiedCardId === op.id ? (
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Custom Arbitrage Deal Calculator & Simulator */}
            {activeSubTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Interactive Input Controls */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">شبیه‌ساز و ماشین‌حساب سود معامله</h3>
                                <p className="text-xs text-slate-500 font-medium">پارامترهای معامله را تغییر دهید تا سود خالص و ریسک بلافاصله محاسبه شوند.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Car Model Select */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مدل خودرو مورد نظر:</label>
                                <select
                                    value={calcCarKey}
                                    onChange={(e) => handleCalculatorCarChange(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                    {KNOWN_ARBITRAGE_CARS.map(c => (
                                        <option key={c.key} value={c.key}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Origin City Select */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">شهر مبدأ خرید:</label>
                                <select
                                    value={calcOrigin}
                                    onChange={(e) => handleCalculatorOriginChange(e.target.value as any)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                    <option value="tehran">تهران (مسافت: ۹۲۰ کیلومتر | خودروبر پیش‌فرض ۱۵ م.ت)</option>
                                    <option value="isfahan">اصفهان (مسافت: ۴۸۵ کیلومتر | خودروبر پیش‌فرض ۹.۵ م.ت)</option>
                                    <option value="bushehr">بوشهر (مسافت: ۲۹۵ کیلومتر | خودروبر پیش‌فرض ۶.۵ م.ت)</option>
                                    <option value="shiraz">شیراز (معامله محلی | بدون هزینه خودروبر بین‌شهری)</option>
                                </select>
                            </div>

                            {/* Buy Price Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">قیمت خرید در مبدأ (تومان):</label>
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                                        {formatToman(calcBuyPrice)}
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="10000000"
                                    value={calcBuyPrice || ''}
                                    onChange={(e) => setCalcBuyPrice(Number(e.target.value))}
                                    placeholder="مثال: ۱۱۵۰۰۰۰۰۰۰"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>

                            {/* Sell Price Shiraz Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">قیمت فروش در شیراز (تومان):</label>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                        {formatToman(calcSellPrice)}
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="10000000"
                                    value={calcSellPrice || ''}
                                    onChange={(e) => setCalcSellPrice(Number(e.target.value))}
                                    placeholder="مثال: ۱۲۱۰۰۰۰۰۰۰"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>

                            {/* Carrier Cost */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">هزینه خودروبر بین‌شهری (تومان):</label>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {formatToman(calcCarrierCost)}
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="1000000"
                                    value={calcCarrierCost || ''}
                                    onChange={(e) => setCalcCarrierCost(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>

                            {/* Inspection & Notary Cost */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">کارشناسی رنگ، فنی و محضر (تومان):</label>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {formatToman(calcInspectionCost)}
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="500000"
                                    value={calcInspectionCost || ''}
                                    onChange={(e) => setCalcInspectionCost(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>

                            {/* Extra / Contingency Cost */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">هزینه‌های پیش‌بینی‌نشده (تومان):</label>
                                <input
                                    type="number"
                                    step="500000"
                                    value={calcExtraCost || ''}
                                    onChange={(e) => setCalcExtraCost(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>

                            {/* Estimated Transit Days */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">زمان تخمینی خرید تا تحویل (روز):</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={calcDays || ''}
                                    onChange={(e) => setCalcDays(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 text-left dir-ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Deal Evaluation & Profit Breakdown */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-900/50 text-white shadow-lg space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <span className="text-xs font-bold text-indigo-300">تحلیل لحظه‌ای معامله شبیه‌سازی‌شده</span>
                                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                                    customDealResult.signal === 'STRONG_BUY' 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                        : customDealResult.netProfitToman > 0 
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                    {customDealResult.signalLabel}
                                </span>
                            </div>

                            {/* Big Net Profit Display */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                                <span className="text-xs text-slate-300 font-medium">سود خالص پیش‌بینی‌شده معامله:</span>
                                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                                    customDealResult.netProfitToman > 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {formatToman(customDealResult.netProfitToman)}
                                </div>
                                <div className="text-xs font-bold text-slate-300 font-mono mt-1">
                                    بازده سرمایه (ROI): <span className={customDealResult.roiPercent > 0 ? 'text-emerald-400 font-black' : 'text-rose-400'}>
                                        {customDealResult.roiPercent > 0 ? '+' : ''}{customDealResult.roiPercent}٪
                                    </span>
                                </div>
                            </div>

                            {/* Line by line breakdown */}
                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between text-slate-300">
                                    <span>اختلاف قیمت خام (Gross Spread):</span>
                                    <span className="font-mono font-bold text-white">{formatToman(customDealResult.grossSpreadToman)}</span>
                                </div>

                                <div className="flex justify-between text-slate-300">
                                    <span>مجموع هزینه‌های جانبی و لجستیک:</span>
                                    <span className="font-mono font-bold text-rose-300">-{formatToman(customDealResult.totalExpensesToman)}</span>
                                </div>

                                <div className="flex justify-between text-slate-300">
                                    <span>کل سرمایه نقدی مورد نیاز:</span>
                                    <span className="font-mono font-bold text-amber-300">{formatToman(customDealResult.totalCapitalRequiredToman)}</span>
                                </div>

                                <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                                    <span>شاخص ریسک معامله:</span>
                                    <span className="font-mono font-bold text-sky-300">{customDealResult.riskScore} از ۱۰۰ ({customDealResult.riskLevel})</span>
                                </div>
                            </div>

                            {/* Summary Strategy Text */}
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed">
                                <p className="font-bold text-white mb-1">📝 خلاصه پیشنهاد راهبردی:</p>
                                <p>{customDealResult.actionSummary}</p>
                            </div>
                        </div>

                        {/* Copy Button */}
                        <button
                            type="button"
                            onClick={() => handleCopyOpportunity(customDealResult)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                        >
                            <Copy className="w-4 h-4" />
                            <span>کپی گزارش محاسباتی این معامله</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: Price Matrix across 4 Key Cities (Shiraz, Tehran, Isfahan, Bushehr) */}
            {activeSubTab === 'matrix' && (
                <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                <span>ماتریس مقایسه قیمت نرمال‌سازی شده ۴ شهر با مرجع شیراز</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                مقایسه کف قیمت بهینه خرید در شهرهای تهران، اصفهان و بوشهر نسبت به قیمت معتبر فروش در شیراز (صرفاً از داده‌های استعلام زنده دیوار).
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-3.5 font-black">مدل خودرو</th>
                                    <th className="p-3.5 font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                                        شیراز 📍 (مرجع فروش)
                                    </th>
                                    <th className="p-3.5 font-black">تهران 🏛️ (خرید)</th>
                                    <th className="p-3.5 font-black">اختلاف تهران با شیراز</th>
                                    <th className="p-3.5 font-black">اصفهان 🏛️ (خرید)</th>
                                    <th className="p-3.5 font-black">اختلاف اصفهان با شیراز</th>
                                    <th className="p-3.5 font-black">بوشهر 🌊 (خرید)</th>
                                    <th className="p-3.5 font-black">اختلاف بوشهر با شیراز</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {KNOWN_ARBITRAGE_CARS.map(car => {
                                    const carSums = citySummariesByCar[car.key] || {};
                                    const shirazSum = carSums['shiraz'];
                                    const tehranSum = carSums['tehran'];
                                    const isfahanSum = carSums['isfahan'];
                                    const bushehrSum = carSums['bushehr'];

                                    const shirazHasData = Boolean(shirazSum?.hasLiveData && shirazSum.effectiveSellPriceToman > 0);
                                    const tehranHasData = Boolean(tehranSum?.hasLiveData && tehranSum.effectiveBuyPriceToman > 0);
                                    const isfahanHasData = Boolean(isfahanSum?.hasLiveData && isfahanSum.effectiveBuyPriceToman > 0);
                                    const bushehrHasData = Boolean(bushehrSum?.hasLiveData && bushehrSum.effectiveBuyPriceToman > 0);

                                    const shirazPrice = shirazHasData ? shirazSum.effectiveSellPriceToman : 0;
                                    const tehranDelta = (tehranHasData && shirazHasData) ? tehranSum.effectiveBuyPriceToman - shirazPrice : 0;
                                    const isfahanDelta = (isfahanHasData && shirazHasData) ? isfahanSum.effectiveBuyPriceToman - shirazPrice : 0;
                                    const bushehrDelta = (bushehrHasData && shirazHasData) ? bushehrSum.effectiveBuyPriceToman - shirazPrice : 0;

                                    return (
                                        <tr key={car.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                                                {car.label}
                                            </td>

                                            {/* Shiraz Reference */}
                                            <td className="p-3.5 font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 font-black">
                                                {shirazHasData ? (
                                                    formatToman(shirazPrice)
                                                ) : (
                                                    <span className="text-slate-400 font-normal">استعلام نشده</span>
                                                )}
                                            </td>

                                            {/* Tehran Buy */}
                                            <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                                                {tehranHasData ? formatToman(tehranSum.effectiveBuyPriceToman) : <span className="text-slate-400 font-normal">استعلام نشده</span>}
                                            </td>
                                            <td className="p-3.5 font-mono font-bold">
                                                {tehranHasData && shirazHasData ? (
                                                    <span className={tehranDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                        {tehranDelta < 0 ? `🔻 ${formatTomanMillion(tehranDelta)} ارزان‌تر` : `🔺 ${formatTomanMillion(tehranDelta)}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-normal">—</span>
                                                )}
                                            </td>

                                            {/* Isfahan Buy */}
                                            <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                                                {isfahanHasData ? formatToman(isfahanSum.effectiveBuyPriceToman) : <span className="text-slate-400 font-normal">استعلام نشده</span>}
                                            </td>
                                            <td className="p-3.5 font-mono font-bold">
                                                {isfahanHasData && shirazHasData ? (
                                                    <span className={isfahanDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                        {isfahanDelta < 0 ? `🔻 ${formatTomanMillion(isfahanDelta)} ارزان‌تر` : `🔺 ${formatTomanMillion(isfahanDelta)}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-normal">—</span>
                                                )}
                                            </td>

                                            {/* Bushehr Buy */}
                                            <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                                                {bushehrHasData ? formatToman(bushehrSum.effectiveBuyPriceToman) : <span className="text-slate-400 font-normal">استعلام نشده</span>}
                                            </td>
                                            <td className="p-3.5 font-mono font-bold">
                                                {bushehrHasData && shirazHasData ? (
                                                    <span className={bushehrDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                        {bushehrDelta < 0 ? `🔻 ${formatTomanMillion(bushehrDelta)} ارزان‌تر` : `🔺 ${formatTomanMillion(bushehrDelta)}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-normal">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
