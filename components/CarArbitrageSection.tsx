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
    Radio,
    MessageSquare
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
import { getDivarArbitragePrices } from '../services/api';
import type { DivarPriceItem, ScrapedCarPrice, CarPriceStats } from '../types';

interface CarArbitrageSectionProps {
    divarListings?: DivarPriceItem[];
    scrapedPrices?: ScrapedCarPrice[];
    priceStats?: CarPriceStats[];
    onRefresh?: () => void;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

const DEFAULT_DIVAR_LISTINGS: DivarPriceItem[] = [];
const DEFAULT_SCRAPED_PRICES: ScrapedCarPrice[] = [];
const DEFAULT_PRICE_STATS: CarPriceStats[] = [];

export const CarArbitrageSection: React.FC<CarArbitrageSectionProps> = ({
    divarListings: propDivarListings = DEFAULT_DIVAR_LISTINGS,
    scrapedPrices = DEFAULT_SCRAPED_PRICES,
    priceStats = DEFAULT_PRICE_STATS,
    onRefresh,
    showToast
}) => {
    // State filters
    const [selectedCarFilter, setSelectedCarFilter] = useState<string>('kmc eagle');
    const [selectedOriginFilter, setSelectedOriginFilter] = useState<string>('all');
    const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'profit' | 'roi' | 'risk' | 'distance'>('profit');
    const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

    // Active Tab inside Arbitrage Section
    const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'calculator'>('opportunities');

    // Selected Target City for Inquiry (all, shiraz, tehran, or isfahan)
    const [selectedInquiryCity, setSelectedInquiryCity] = useState<'all' | ArbitrageCityKey>('all');

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

    // Expandable cards state (click to show full financial details)
    const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

    const toggleExpandCard = useCallback((cardId: string) => {
        setExpandedCardIds(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    }, []);

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
            const rawItems = await getDivarArbitragePrices(carQuery, cityKey, controller.signal);
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

    // 2. Sequential Inquiry for multiple cities with a 1-second gap between cities
    const handleFetchSequentialCitiesLive = useCallback(async (targetCarKey?: string) => {
        stopAllInquiries();
        stopSequenceFlagRef.current = false;
        setIsSequentialRunning(true);

        const carQuery = targetCarKey && targetCarKey !== 'all' ? targetCarKey : (selectedCarFilter !== 'all' ? selectedCarFilter : 'kmc eagle');
        const cities: ArbitrageCityKey[] = ['shiraz', 'tehran', 'isfahan'];

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
                const rawItems = await getDivarArbitragePrices(carQuery, currentCity, controller.signal);
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

            // If there's another city in the queue, wait 1 second before inquiring the next one!
            if (i < cities.length - 1 && !stopSequenceFlagRef.current) {
                const nextCity = cities[i + 1];
                setNextCityInQueue(nextCity);
                setCountdownSeconds(1);

                await new Promise<void>((resolve) => {
                    skipCountdownResolverRef.current = resolve;
                    let remaining = 1;

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

    // Automatic Live Inquiry on Car Selection change
    const handleCarFilterChange = (newCar: string) => {
        setSelectedCarFilter(newCar);
        const queryCar = newCar !== 'all' ? newCar : 'kmc eagle';
        if (selectedInquiryCity === 'all') {
            handleFetchSequentialCitiesLive(queryCar);
        } else {
            handleInquireSingleCity('shiraz', queryCar).then(() => {
                if (selectedInquiryCity !== 'shiraz') {
                    handleInquireSingleCity(selectedInquiryCity, queryCar);
                }
            });
        }
    };

    // Automatic Live Inquiry on City Selection change
    const handleInquiryCityChange = (newCity: 'all' | ArbitrageCityKey) => {
        setSelectedInquiryCity(newCity);
        setSelectedOriginFilter(newCity);
        const queryCar = selectedCarFilter !== 'all' ? selectedCarFilter : 'kmc eagle';
        if (newCity === 'all') {
            handleFetchSequentialCitiesLive(queryCar);
        } else {
            handleInquireSingleCity(newCity, queryCar);
        }
    };

    // Initial Live Inquiry on mount (Auto-inquire all 3 cities: Shiraz, Tehran, Isfahan)
    useEffect(() => {
        handleFetchSequentialCitiesLive('kmc eagle');
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

    const handleToggleExpandAll = useCallback(() => {
        setExpandedCardIds(prev => {
            const anyExpanded = filteredOpportunities.some(op => !!prev[op.id]);
            if (anyExpanded) {
                return {};
            }
            const nextState: Record<string, boolean> = {};
            filteredOpportunities.forEach(op => {
                nextState[op.id] = true;
            });
            return nextState;
        });
    }, [filteredOpportunities]);

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
            {/* Unified Clean & Fast Control Header */}
            <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
                {/* 1. Header Title & Live Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shadow-2xs">
                                <TrendingUp className="w-5 h-5" />
                            </span>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                آربیتراژ خودرو (شیراز 📍 - تهران 🏛️ - اصفهان 🏛️)
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            استعلام زنده آگهی‌های دیوار • خرید زیر قیمت در تهران و اصفهان و فروش با سود در شیراز
                        </p>
                    </div>

                    {/* Live Status Badge & One-Click Refresh */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isInquiring ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                <span>
                                    در حال استعلام {activeInquiringCity ? ARBITRAGE_CITIES_CONFIG[activeInquiringCity].label.split(' ')[0] : ''} ({inquiryElapsedSeconds}ثانیه)...
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>{filteredOpportunities.length} فرصت فعال</span>
                                {summaryMetrics.maxProfit > 0 && (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono border-r border-emerald-200 dark:border-emerald-800 pr-2 mr-1">
                                        حداکثر سود: {formatToman(summaryMetrics.maxProfit)}
                                    </span>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleExecuteInquiry}
                            disabled={isInquiring || isSequentialRunning}
                            className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                            title="استعلام مجدد لحظه‌ای"
                        >
                            <RefreshCw className={`w-4 h-4 ${isInquiring ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* 2. Interactive Fast Controls (Car Selector + City Segment Buttons) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Car Dropdown */}
                    <div className="lg:col-span-4">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                            مدل خودرو (استعلام آنی با تغییر):
                        </label>
                        <div className="relative">
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 dark:text-indigo-400">
                                <Car className="w-4 h-4" />
                            </div>
                            <select
                                value={selectedCarFilter}
                                onChange={(e) => handleCarFilterChange(e.target.value)}
                                disabled={isInquiring || isSequentialRunning}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pr-9 pl-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                {KNOWN_ARBITRAGE_CARS.map(c => (
                                    <option key={c.key} value={c.key}>
                                        {c.label}
                                    </option>
                                ))}
                                <option value="all">همه مدل‌های خودرو</option>
                            </select>
                        </div>
                    </div>

                    {/* City Segment Buttons (شیراز - تهران - اصفهان) */}
                    <div className="lg:col-span-8">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                            شهر استعلام / مبدأ معامله (کلیک جهت استعلام سریع):
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                            {[
                                { key: 'all', label: 'همه شهرها (تهران و اصفهان ⬅️ شیراز)', icon: '🌐' },
                                { key: 'tehran', label: 'تهران', icon: '🏛️' },
                                { key: 'isfahan', label: 'اصفهان', icon: '🏛️' },
                                { key: 'shiraz', label: 'شیراز (مرجع)', icon: '📍' }
                            ].map(item => {
                                const isSelected = selectedInquiryCity === item.key;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => handleInquiryCityChange(item.key as any)}
                                        disabled={isInquiring || isSequentialRunning}
                                        className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            isSelected
                                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Secondary Bar: View mode tabs & quick sort (compact, sleek) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {/* View Mode Switcher (فرصت‌ها vs ماشین‌حساب) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('opportunities')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeSubTab === 'opportunities'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                            <span>فرصت‌های معامله ({filteredOpportunities.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('calculator')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeSubTab === 'calculator'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ماشین‌حساب و شبیه‌ساز</span>
                        </button>
                    </div>

                    {/* Quick Filters, Sort & Expand All Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold">
                            <span>فیلتر:</span>
                            <select
                                value={selectedRiskFilter}
                                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                                className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer text-xs"
                            >
                                <option value="all">همه فرصت‌ها</option>
                                <option value="profitable_only">فقط سودآور</option>
                                <option value="strong_only">فرصت طلایی 🟢</option>
                                <option value="low_only">کم‌ریسک</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold">
                            <span>مرتب‌سازی:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer text-xs"
                            >
                                <option value="profit">بیشترین سود خالص</option>
                                <option value="roi">بالاترین درصد بازده</option>
                                <option value="risk">کمترین شاخص ریسک</option>
                                <option value="distance">نزدیک‌ترین مسافت</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleExpandAll}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                        >
                            {filteredOpportunities.some(op => !!expandedCardIds[op.id]) ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>بستن همه</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>مشاهده مشخصات همه</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: Opportunities List */}
            {activeSubTab === 'opportunities' && (
                <div className="space-y-6">

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
                                            ? 'استعلام نوبتی ۴ شهر (فاصله ۱ ثانیه)'
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {filteredOpportunities.map((op) => {
                                const isProfitable = op.netProfitToman > 0;
                                const isStrong = op.signal === 'STRONG_BUY';
                                const isExpanded = !!expandedCardIds[op.id];

                                return (
                                    <div 
                                        key={op.id}
                                        onClick={() => toggleExpandCard(op.id)}
                                        className={`bg-white dark:bg-slate-850 rounded-3xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden relative cursor-pointer select-none ${
                                            isStrong 
                                                ? 'border-emerald-500/60 dark:border-emerald-500/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                                                : isProfitable
                                                    ? 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    : 'border-slate-200/60 dark:border-slate-800 opacity-80'
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

                                        <div className="p-5 space-y-3.5 flex-grow">
                                            {/* 1. پیشنهاد معامله (Main Strategic Banner) */}
                                            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                                    <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                                                        <span>پیشنهاد معامله:</span>
                                                    </span>
                                                    {isStrong && (
                                                        <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                                                            فرصت طلایی
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                                                    {op.actionSummary}
                                                </p>
                                            </div>

                                             {/* 2. لینک آگهی خرید و آگهی فروش (Clickable Divar links) */}
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                                                 {/* Buy Ad Link (Call / Negotiate with seller in City A) */}
                                                 <a
                                                     href={op.buyAdHref || `https://divar.ir/s/${op.originCity}/car?q=${encodeURIComponent(op.carName)}`}
                                                     target="_blank"
                                                     rel="noopener noreferrer"
                                                     onClick={(e) => e.stopPropagation()}
                                                     className="p-3 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 flex flex-col justify-between text-xs transition-all group shadow-2xs hover:shadow-sm"
                                                     title="مشاهده آگهی و تماس با مالک خودرو در دیوار"
                                                 >
                                                     <div className="flex items-center justify-between gap-1 mb-1.5">
                                                         <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white font-black text-[10px]">
                                                             آگهی ارزان مبدأ ({op.originCityLabel.split(' ')[0]})
                                                         </span>
                                                         <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1 group-hover:underline">
                                                             تماس با مالک 📞 ↗
                                                         </span>
                                                     </div>
                                                     <div className="space-y-0.5">
                                                         <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                                                             {op.buyAdTitle || `آگهی خرید در ${op.originCityLabel.split(' ')[0]}`}
                                                         </span>
                                                         <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                             <span>قیمت فروشنده:</span>
                                                             <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                 {formatToman(op.buyPriceToman)}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 </a>

                                                 {/* Sell Ad Link (City B - Shiraz benchmark/target listing) */}
                                                 <a
                                                     href={op.sellAdHref || `https://divar.ir/s/shiraz/car?q=${encodeURIComponent(op.carName)}`}
                                                     target="_blank"
                                                     rel="noopener noreferrer"
                                                     onClick={(e) => e.stopPropagation()}
                                                     className="p-3 bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col justify-between text-xs transition-all group shadow-2xs hover:shadow-sm"
                                                     title="مشاهده آگهی مرجع فروش در بازار شیراز"
                                                 >
                                                     <div className="flex items-center justify-between gap-1 mb-1.5">
                                                         <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px]">
                                                             فروش در شیراز
                                                         </span>
                                                         <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                                                             آگهی بازار شیراز ↗
                                                         </span>
                                                     </div>
                                                     <div className="space-y-0.5">
                                                         <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                             {op.sellAdTitle || 'آگهی فروش در شیراز'}
                                                         </span>
                                                         <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                             <span>نرخ فروش بازار:</span>
                                                             <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                                 {formatToman(op.sellPriceShirazToman)}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 </a>
                                             </div>

                                            {/* 3. شاخص ریسک و کلیک برای سایر مشخصات */}
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                                                        op.riskLevel === 'LOW'
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : op.riskLevel === 'MEDIUM'
                                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    }`}>
                                                        {op.riskLevel === 'LOW' ? (
                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                        )}
                                                        <span>شاخص ریسک: {op.riskScore}/۱۰۰</span>
                                                        <span className="opacity-80 text-[10px]">
                                                            ({op.riskLevel === 'LOW' ? 'کم‌ریسک 🟢' : op.riskLevel === 'MEDIUM' ? 'ریسک متوسط 🟡' : 'پرریسک 🔴'})
                                                        </span>
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpandCard(op.id);
                                                    }}
                                                    className={`text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer py-1.5 px-3 rounded-xl border select-none ${
                                                        isExpanded
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-600/30 hover:bg-indigo-700'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                                    }`}
                                                    title={isExpanded ? 'بستن مشخصات فنی و مالی' : 'مشاهده سایر مشخصات، بهای تمام‌شده و راهنما'}
                                                >
                                                    <span>{isExpanded ? 'بستن مشخصات' : 'سایر مشخصات'}</span>
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>

                                            {/* 4. سایر مشخصات در صورت کلیک روی کارت یا دکمه */}
                                            {isExpanded && (
                                                <div 
                                                    onClick={(e) => e.stopPropagation()} 
                                                    className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3 transition-all duration-300"
                                                >
                                                    {/* Financial breakdown */}
                                                    <div className="space-y-2 bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                            <span>قیمت خرید نرمال در {op.originCityLabel.split(' ')[0]}:</span>
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
                                                            <span>بهای تمام‌شده کل:</span>
                                                            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                                                {formatToman(op.totalCapitalRequiredToman)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                                            <span>قیمت فروش نرمال بازار در شیراز:</span>
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

                                                    {/* Ad Description & Direct Negotiation Helper */}
                                                    {(op.buyAdDesc || op.sellAdDesc) && (
                                                        <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-1.5">
                                                            <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                                                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                                <span>متن آگهی و نکته مذاکره با مالک خودرو:</span>
                                                            </div>
                                                            {op.buyAdDesc && (
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-100 dark:border-slate-800">
                                                                    🗣️ <strong className="text-slate-900 dark:text-white">توضیحات آگهی خرید:</strong> {op.buyAdDesc}
                                                                </p>
                                                            )}
                                                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                                                💡 راهنما: روی دکمه «تماس با مالک 📞» کلیک کنید، مشخصات فنی و رنگ خودرو را بپرسید و در صورت توافق، معامله را نهایی کنید.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Distance & Days */}
                                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono px-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {op.estimatedDays === 0 ? 'تحویل فوری در شیراز' : `زمان جابجایی: ~${op.estimatedDays} روز`}
                                                        </span>
                                                        <span>مسافت: {op.distanceKm} کیلومتر</span>
                                                    </div>

                                                    {op.riskFactors.length > 0 && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl leading-relaxed">
                                                            💡 {op.riskFactors[0]}
                                                        </p>
                                                    )}

                                                    {/* Card Actions Footer */}
                                                    <div className="pt-2 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLoadIntoCalculator(op);
                                                            }}
                                                            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
                                                        >
                                                            <Calculator className="w-3.5 h-3.5" />
                                                            <span>شخصی‌سازی در ماشین‌حساب</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyOpportunity(op);
                                                            }}
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
                                            )}
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
                            <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 rounded-2xl border border-emerald-500/30 text-xs text-slate-200 leading-relaxed shadow-sm">
                                <div className="flex items-center gap-1.5 font-black text-emerald-300 mb-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>پیشنهاد معامله:</span>
                                </div>
                                <p className="font-black text-white text-sm">{customDealResult.actionSummary}</p>
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
