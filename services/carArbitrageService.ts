import { 
    ArbitrageCityKey, 
    ARBITRAGE_CITIES_CONFIG, 
    CarArbitrageOpportunity, 
    CityPriceSummary,
    ArbitrageRiskLevel,
    ArbitrageSignal,
    CustomCalculatorInput
} from '../types/carArbitrage';
import type { DivarPriceItem, ScrapedCarPrice, CarPriceStats } from '../types';

export const KNOWN_ARBITRAGE_CARS = [
    { key: 'kmc eagle', label: 'کی‌ام‌سی ایگل (KMC Eagle)', brand: 'کرمان موتور' },
    { key: 'jac j4', label: 'جک جی۴ (JAC J4)', brand: 'کرمان موتور' },
    { key: 'bac x3-pro', label: 'بک ایکس۳ پرو (BAC X3 Pro)', brand: 'خودروسازان بم' },
    { key: 'kmc t8', label: 'کی‌ام‌سی تی۸ (KMC T8)', brand: 'کرمان موتور' },
    { key: 'kmc x5', label: 'کی‌ام‌سی ایکس۵ (KMC X5)', brand: 'کرمان موتور' },
    { key: 'kmc j7', label: 'کی‌ام‌سی جی۷ (KMC J7)', brand: 'کرمان موتور' },
    { key: 'kmc t9-pick-up', label: 'کی‌ام‌سی تی۹ پیکاپ (KMC T9)', brand: 'کرمان موتور' },
    { key: 'kmc sr3', label: 'کی‌ام‌سی اس‌آر۳ (KMC SR3)', brand: 'کرمان موتور' },
    { key: 'kmc sr6-1.5l-turbo', label: 'کی‌ام‌سی اس‌آر۶ توربو (KMC SR6)', brand: 'کرمان موتور' },
    { key: 'kmc ej7', label: 'کی‌ام‌سی برقی ای‌جی۷ (KMC EJ7)', brand: 'کرمان موتور' }
];

export function getCarLabelByKey(key: string): string {
    const found = KNOWN_ARBITRAGE_CARS.find(c => c.key.toLowerCase() === key.toLowerCase());
    return found ? found.label : key;
}

// Convert Divar prices safely (Divar prices are already in Tomans)
export function toToman(amount: number): number {
    if (!amount || isNaN(amount) || amount <= 0) return 0;
    // Divar prices are in Tomans (e.g. 1,150,000,000 Toman)
    // If a scraper source provides values in Rials (e.g., >= 20 billion Rials for typical passenger cars), convert to Toman
    if (amount >= 20_000_000_000) {
        return Math.round(amount / 10);
    }
    return Math.round(amount);
}

// Format Toman into Persian readable text (e.g. ۱,۲۵۰,۰۰۰,۰۰۰ تومان)
export function formatToman(amount: number): string {
    if (!amount || isNaN(amount) || amount <= 0) return '۰ تومان';
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return `${sign}${abs.toLocaleString('fa-IR')} تومان`;
}

export function formatTomanMillion(amount: number): string {
    if (!amount || isNaN(amount) || amount === 0) return '۰ م.ت';
    const millions = Math.round(amount / 1_000_000);
    const sign = millions < 0 ? '-' : '+';
    return `${sign}${Math.abs(millions).toLocaleString('fa-IR')} م.ت`;
}

// Format Inquiry relative time in Persian
export function formatInquiryTimeAgo(timestampStr?: string | null): string {
    if (!timestampStr) return 'استعلام نشده';
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) return timestampStr;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);

    const timeString = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (diffSec < 45) {
        return `هم‌اکنون (${timeString})`;
    }
    if (diffMin < 60) {
        return `${diffMin.toLocaleString('fa-IR')} دقیقه پیش (${timeString})`;
    }
    if (diffHours < 24) {
        return `${diffHours.toLocaleString('fa-IR')} ساعت پیش (${timeString})`;
    }
    return `${date.toLocaleDateString('fa-IR')} ${timeString}`;
}

// Statistical calculation of Mode with 5-Million bucket clustering for automotive prices
export function calculateBucketMode(numbers: number[], bucketSize: number = 5_000_000): { modePrice: number; count: number } {
    if (numbers.length === 0) return { modePrice: 0, count: 0 };
    if (numbers.length === 1) return { modePrice: numbers[0], count: 1 };

    const buckets: Record<number, { sum: number; count: number; rawPrices: number[] }> = {};

    for (const p of numbers) {
        const bucketKey = Math.round(p / bucketSize) * bucketSize;
        if (!buckets[bucketKey]) {
            buckets[bucketKey] = { sum: 0, count: 0, rawPrices: [] };
        }
        buckets[bucketKey].sum += p;
        buckets[bucketKey].count += 1;
        buckets[bucketKey].rawPrices.push(p);
    }

    let maxCount = 0;
    let bestBucketKey = 0;

    for (const keyStr in buckets) {
        const key = Number(keyStr);
        const b = buckets[key];
        if (b.count > maxCount) {
            maxCount = b.count;
            bestBucketKey = key;
        }
    }

    const bestBucket = buckets[bestBucketKey];
    if (!bestBucket) return { modePrice: numbers[0], count: 1 };

    const avgInBestBucket = Math.round(bestBucket.sum / bestBucket.count);
    return { modePrice: avgInBestBucket, count: bestBucket.count };
}

// Complete Divar-Style Normalization
// Strict rule: Never invent or show offline fallback prices if raw prices are empty
export function normalizeCityPrices(rawPrices: number[]): {
    hasLiveData: boolean;
    normalPrices: number[];
    outliers: number[];
    min: number;
    max: number;
    avg: number;
    mode: number;
    median: number;
    trimmedMean: number;
    effectiveBuy: number;
    effectiveSell: number;
} {
    // 1. Filter out invalid, non-price and installment downpayments (< 100M or > 15B)
    const valid = rawPrices.filter(p => p >= 150_000_000 && p <= 15_000_000_000);
    
    if (valid.length === 0) {
        return {
            hasLiveData: false,
            normalPrices: [],
            outliers: [],
            min: 0,
            max: 0,
            avg: 0,
            mode: 0,
            median: 0,
            trimmedMean: 0,
            effectiveBuy: 0,
            effectiveSell: 0
        };
    }

    // Sort ascending
    const sorted = [...valid].sort((a, b) => a - b);
    
    // 2. Identify and filter extreme outliers (e.g. deviating > 30% from the median)
    const midIndex = Math.floor(sorted.length / 2);
    const rawMedian = sorted.length % 2 !== 0 ? sorted[midIndex] : (sorted[midIndex - 1] + sorted[midIndex]) / 2;

    const normalPrices: number[] = [];
    const outliers: number[] = [];

    for (const p of sorted) {
        const deviationRatio = Math.abs(p - rawMedian) / rawMedian;
        // If deviation is > 25% away from median, mark as outlier (downpayment or typo)
        if (deviationRatio > 0.25) {
            outliers.push(p);
        } else {
            normalPrices.push(p);
        }
    }

    // If too few remain in normal, use trimmed array of valid
    const cleanList = normalPrices.length >= 2 ? normalPrices : (sorted.length >= 4 ? sorted.slice(1, -1) : sorted);

    if (cleanList.length === 0) {
        return {
            hasLiveData: false,
            normalPrices: [],
            outliers: valid,
            min: 0,
            max: 0,
            avg: 0,
            mode: 0,
            median: 0,
            trimmedMean: 0,
            effectiveBuy: 0,
            effectiveSell: 0
        };
    }

    // 3. Compute statistical indicators on normalized clean list
    const min = Math.min(...cleanList);
    const max = Math.max(...cleanList);
    const avg = Math.round(cleanList.reduce((a, b) => a + b, 0) / cleanList.length);

    // Median
    const mIdx = Math.floor(cleanList.length / 2);
    const median = cleanList.length % 2 !== 0 ? cleanList[mIdx] : Math.round((cleanList[mIdx - 1] + cleanList[mIdx]) / 2);

    // Mode
    const { modePrice } = calculateBucketMode(cleanList, 5_000_000);
    const mode = modePrice || median;

    // 10% Trimmed Mean
    let trimmedMean = avg;
    if (cleanList.length >= 6) {
        const trim = Math.floor(cleanList.length * 0.1);
        const sub = cleanList.slice(trim, cleanList.length - trim);
        trimmedMean = Math.round(sub.reduce((a, b) => a + b, 0) / sub.length);
    }

    // Effective Buy Price = 25th percentile of normalized clean market (کف خرید منطقی در مبدأ)
    const q1Idx = Math.floor(cleanList.length * 0.25);
    const effectiveBuy = cleanList[q1Idx] || min;

    // Effective Sell Price = Mode or median of normalized market (قیمت رایج فروش)
    const effectiveSell = mode || median;

    return {
        hasLiveData: true,
        normalPrices: cleanList,
        outliers,
        min,
        max,
        avg,
        mode,
        median,
        trimmedMean,
        effectiveBuy,
        effectiveSell
    };
}

// Calculate realistic City Price Summary with full normalization
// NEVER fabricate offline data
export function calculateCityPriceSummary(
    cityKey: ArbitrageCityKey,
    prices: number[],
    shirazReferencePriceToman?: number,
    inquiryTimestamp?: string
): CityPriceSummary {
    const config = ARBITRAGE_CITIES_CONFIG[cityKey];
    const norm = normalizeCityPrices(prices);

    if (!norm.hasLiveData || norm.normalPrices.length === 0) {
        return {
            cityKey,
            cityLabel: config.label,
            sampleCount: 0,
            rawCount: prices.length,
            outlierCount: norm.outliers.length,
            minPriceToman: 0,
            maxPriceToman: 0,
            avgPriceToman: 0,
            modePriceToman: 0,
            medianPriceToman: 0,
            trimmedMeanToman: 0,
            effectiveBuyPriceToman: 0,
            effectiveSellPriceToman: 0,
            priceDeltaAgainstShirazToman: 0,
            lastUpdated: undefined,
            inquiryTimestamp: inquiryTimestamp || undefined,
            isNormalized: false,
            hasLiveData: false
        };
    }

    const effectiveBuy = norm.effectiveBuy;
    const effectiveSell = norm.effectiveSell;
    const refShiraz = shirazReferencePriceToman || effectiveSell;
    const priceDeltaAgainstShiraz = refShiraz > 0 ? effectiveBuy - refShiraz : 0;

    return {
        cityKey,
        cityLabel: config.label,
        sampleCount: norm.normalPrices.length,
        rawCount: prices.length,
        outlierCount: norm.outliers.length,
        minPriceToman: norm.min,
        maxPriceToman: norm.max,
        avgPriceToman: norm.avg,
        modePriceToman: norm.mode,
        medianPriceToman: norm.median,
        trimmedMeanToman: norm.trimmedMean,
        effectiveBuyPriceToman: effectiveBuy,
        effectiveSellPriceToman: effectiveSell,
        priceDeltaAgainstShirazToman: priceDeltaAgainstShiraz,
        lastUpdated: new Date().toISOString(),
        inquiryTimestamp: inquiryTimestamp || new Date().toISOString(),
        isNormalized: true,
        hasLiveData: true
    };
}

// Calculate Risk Profile for an opportunity
export function evaluateArbitrageRisk(
    originCity: ArbitrageCityKey,
    grossSpreadToman: number,
    netProfitToman: number,
    roiPercent: number,
    carBasePriceToman: number,
    sampleCount: number
): {
    riskLevel: ArbitrageRiskLevel;
    riskScore: number;
    riskFactors: string[];
    signal: ArbitrageSignal;
    signalLabel: string;
} {
    const config = ARBITRAGE_CITIES_CONFIG[originCity];
    const riskFactors: string[] = [];
    let riskScore = 15; // baseline

    // 1. Distance & Logistics Risk
    if (config.distanceToShirazKm > 800) {
        riskScore += 25;
        riskFactors.push(`مسافت طولانی (${config.distanceToShirazKm} کیلومتر) و زمان حمل ${config.estimatedTransportDays} روزه`);
    } else if (config.distanceToShirazKm > 400) {
        riskScore += 15;
        riskFactors.push(`مسافت متوسط (${config.distanceToShirazKm} کیلومتر)`);
    } else if (config.distanceToShirazKm > 0) {
        riskScore += 5;
        riskFactors.push(`مسافت کوتاه (${config.distanceToShirazKm} کیلومتر)`);
    } else {
        riskScore += 0;
        riskFactors.push('معامله محلی درون شیراز بدون ریسک تردد بین‌شهری');
    }

    // 2. Profit Margin & Downside Protection
    if (netProfitToman <= 0) {
        riskScore += 50;
        riskFactors.push('سود خالص منفی یا صفر (عدم توجیه اقتصادی پس از کسر هزینه حمل و کارشناسی)');
    } else if (roiPercent < 1.5) {
        riskScore += 25;
        riskFactors.push(`حاشیه سود اندک (+${roiPercent}٪) با حساسیت بالا به نوسان روزانه بازار`);
    } else if (roiPercent >= 3.0) {
        riskScore -= 10;
        riskFactors.push(`حاشیه سود ایمن و مناسب (+${roiPercent}٪)`);
    }

    // 3. Data Confidence & Sample Depth
    if (sampleCount <= 1) {
        riskScore += 20;
        riskFactors.push('تعداد آگهی‌های استعلام‌شده محدود در مبدأ');
    } else if (sampleCount >= 4) {
        riskScore -= 10;
        riskFactors.push(`حجم نمونه بالا (${sampleCount} آگهی معتبر استعلام‌شده)`);
    }

    // Normalize risk score 0 to 100
    riskScore = Math.max(5, Math.min(95, riskScore));

    let riskLevel: ArbitrageRiskLevel = 'LOW';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 55) riskLevel = 'HIGH';
    else if (riskScore >= 35) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Determine Signal
    let signal: ArbitrageSignal = 'MODERATE';
    let signalLabel = 'فرصت معمولی با بازدهی متناسب';

    if (netProfitToman <= 0) {
        signal = 'AVOID';
        signalLabel = 'فاقد توجیه اقتصادی (هزینه جابجایی بیش از اختلاف قیمت)';
    } else if (roiPercent >= 3.0 && (riskLevel === 'LOW' || riskLevel === 'MEDIUM')) {
        signal = 'STRONG_BUY';
        signalLabel = '🟢 فرصت طلایی آربیتراژ (سود بالا با ریسک کنترل‌شده)';
    } else if (roiPercent >= 1.5 && riskLevel !== 'CRITICAL') {
        signal = 'BUY';
        signalLabel = '🔵 فرصت خرید مناسب با سود خالص مثبت';
    } else if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        signal = 'AVOID';
        signalLabel = '🟡 ریسک بالا نسبت به حاشیه سود (نیاز به احتیاط)';
    }

    return {
        riskLevel,
        riskScore,
        riskFactors,
        signal,
        signalLabel
    };
}

// Build Comprehensive Opportunities List
// STRICT REQUIREMENT: Only generate opportunities when live data is available. Never show offline fake prices.
export function generateArbitrageOpportunities(params: {
    cityLiveListings?: Record<ArbitrageCityKey, DivarPriceItem[]>;
    divarListings?: DivarPriceItem[];
    scrapedPrices?: ScrapedCarPrice[];
    priceStats?: CarPriceStats[];
    selectedCarKey?: string;
}): {
    opportunities: CarArbitrageOpportunity[];
    citySummariesByCar: Record<string, Record<ArbitrageCityKey, CityPriceSummary>>;
} {
    const { cityLiveListings, divarListings = [], scrapedPrices = [], selectedCarKey } = params;
    const carsToAnalyze = selectedCarKey && selectedCarKey !== 'all'
        ? KNOWN_ARBITRAGE_CARS.filter(c => c.key === selectedCarKey)
        : KNOWN_ARBITRAGE_CARS;

    const citySummariesByCar: Record<string, Record<ArbitrageCityKey, CityPriceSummary>> = {};
    const opportunities: CarArbitrageOpportunity[] = [];

    carsToAnalyze.forEach(car => {
        const carKey = car.key;
        citySummariesByCar[carKey] = {} as Record<ArbitrageCityKey, CityPriceSummary>;

        const targetCities: ArbitrageCityKey[] = ['shiraz', 'tehran', 'isfahan', 'bushehr'];
        
        // 1. Collect real live price points for each city
        targetCities.forEach(cityKey => {
            const cityPricesToman: number[] = [];

            // A. From Dedicated City Live Inquiries Bucket
            if (cityLiveListings && cityLiveListings[cityKey]) {
                cityLiveListings[cityKey].forEach(item => {
                    const itemCar = (item.car_name || '').toLowerCase();
                    const itemTitle = (item.title || '').toLowerCase();
                    const itemDesc = (item.desc || '').toLowerCase();
                    const matchesCar = itemCar.includes(carKey) || itemTitle.includes(carKey) || itemDesc.includes(carKey) || carKey.includes(itemCar);

                    if (matchesCar && typeof item.price === 'number' && item.price > 0) {
                        const valToman = toToman(item.price);
                        if (valToman >= 150_000_000 && valToman <= 15_000_000_000) {
                            cityPricesToman.push(valToman);
                        }
                    }
                });
            }

            // B. From General Divar Listings if tagged or detected
            divarListings.forEach(item => {
                const itemCar = (item.car_name || '').toLowerCase();
                const itemTitle = (item.title || '').toLowerCase();
                const itemDesc = (item.desc || '').toLowerCase();
                const matchesCar = itemCar.includes(carKey) || itemTitle.includes(carKey) || itemDesc.includes(carKey) || carKey.includes(itemCar);

                if (matchesCar && typeof item.price === 'number' && item.price > 0) {
                    const text = `${item.title || ''} ${item.desc || ''}`.toLowerCase();
                    let matchesCity = false;
                    if (cityKey === 'shiraz' && (text.includes('شیراز') || text.includes('فارس'))) matchesCity = true;
                    if (cityKey === 'tehran' && (text.includes('تهران') || text.includes('پایتخت'))) matchesCity = true;
                    if (cityKey === 'isfahan' && text.includes('اصفهان')) matchesCity = true;
                    if (cityKey === 'bushehr' && (text.includes('بوشهر') || text.includes('گناوه') || text.includes('دشتستان'))) matchesCity = true;

                    if (matchesCity) {
                        const valToman = toToman(item.price);
                        if (valToman >= 150_000_000 && valToman <= 15_000_000_000) {
                            cityPricesToman.push(valToman);
                        }
                    }
                }
            });

            // C. From Scraped market baseline (Tehran only)
            scrapedPrices.forEach(p => {
                const model = (p.model_name || '').toLowerCase();
                if (model.includes(carKey) && p.price_rial && p.price_rial > 0) {
                    if (cityKey === 'tehran') {
                        const valToman = toToman(p.price_rial);
                        if (valToman >= 150_000_000 && valToman <= 15_000_000_000) {
                            cityPricesToman.push(valToman);
                        }
                    }
                }
            });

            // Calculate live summary (no fallback)
            const summary = calculateCityPriceSummary(
                cityKey,
                cityPricesToman
            );
            citySummariesByCar[carKey][cityKey] = summary;
        });

        // 2. Shiraz Reference (مرجع اصلی: فقط اگر در شیراز آگهی زنده استعلام‌شده وجود داشته باشد)
        const shirazSummary = citySummariesByCar[carKey]['shiraz'];
        const hasShirazLiveData = shirazSummary && shirazSummary.hasLiveData && shirazSummary.effectiveSellPriceToman > 0;
        const sellPriceShirazToman = hasShirazLiveData ? shirazSummary.effectiveSellPriceToman : 0;

        // 3. Build Real Arbitrage Opportunities (ONLY IF LIVE DATA EXISTS FOR BOTH ORIGIN AND SHIRAZ)
        if (hasShirazLiveData && sellPriceShirazToman > 0) {
            const originCities: ArbitrageCityKey[] = ['tehran', 'isfahan', 'bushehr', 'shiraz'];

            originCities.forEach(origin => {
                const originConfig = ARBITRAGE_CITIES_CONFIG[origin];
                const originSummary = citySummariesByCar[carKey][origin];
                const isLocal = origin === 'shiraz';

                // Ensure origin has real live data
                if (!originSummary || !originSummary.hasLiveData || originSummary.effectiveBuyPriceToman <= 0) {
                    return; // Skip if no live data for origin
                }

                let buyPriceToman = originSummary.effectiveBuyPriceToman;
                let carrierCostToman = originConfig.defaultCarrierCostToman;
                let inspectionCostToman = originConfig.defaultInspectionCostToman;

                if (isLocal) {
                    // For local Shiraz trade, require at least 2 real ads or clear spread
                    if (originSummary.sampleCount < 2 || originSummary.minPriceToman >= sellPriceShirazToman) {
                        return; // No distinct local spread
                    }
                    buyPriceToman = originSummary.minPriceToman;
                    carrierCostToman = 0;
                    inspectionCostToman = 2_000_000;
                }

                const grossSpreadToman = sellPriceShirazToman - buyPriceToman;
                const totalExpensesToman = carrierCostToman + inspectionCostToman;
                const totalCapitalRequiredToman = buyPriceToman + totalExpensesToman;
                const netProfitToman = grossSpreadToman - totalExpensesToman;
                const roiPercent = totalCapitalRequiredToman > 0 
                    ? Number(((netProfitToman / totalCapitalRequiredToman) * 100).toFixed(2))
                    : 0;

                const riskAnalysis = evaluateArbitrageRisk(
                    origin,
                    grossSpreadToman,
                    netProfitToman,
                    roiPercent,
                    sellPriceShirazToman,
                    originSummary.sampleCount
                );

                let actionSummary = '';
                if (isLocal) {
                    actionSummary = `خرید ${car.label} در کف بازار شیراز با قیمت ${formatToman(buyPriceToman)} و فروش مجدد در شیراز به قیمت ${formatToman(sellPriceShirazToman)}`;
                } else {
                    actionSummary = `خرید ${car.label} از شهر ${originConfig.label} به قیمت ${formatToman(buyPriceToman)} و حمل با خودروبر به شیراز جهت فروش با قیمت ${formatToman(sellPriceShirazToman)}`;
                }

                const opportunity: CarArbitrageOpportunity = {
                    id: `${carKey}-${origin}-to-shiraz`,
                    carKey,
                    carName: car.label,
                    tradeType: isLocal ? 'INTRA_CITY_SHIRAZ' : 'CROSS_CITY_ARBITRAGE',
                    originCity: origin,
                    originCityLabel: originConfig.label,
                    destinationCity: 'shiraz',
                    destinationCityLabel: ARBITRAGE_CITIES_CONFIG.shiraz.label,
                    distanceKm: originConfig.distanceToShirazKm,
                    estimatedDays: originConfig.estimatedTransportDays,
                    buyPriceToman,
                    sellPriceShirazToman,
                    grossSpreadToman,
                    carrierCostToman,
                    inspectionCostToman,
                    totalExpensesToman,
                    totalCapitalRequiredToman,
                    netProfitToman,
                    roiPercent,
                    riskLevel: riskAnalysis.riskLevel,
                    riskScore: riskAnalysis.riskScore,
                    riskFactors: riskAnalysis.riskFactors,
                    signal: riskAnalysis.signal,
                    signalLabel: riskAnalysis.signalLabel,
                    actionSummary,
                    originSampleCount: originSummary.sampleCount,
                    shirazSampleCount: shirazSummary.sampleCount,
                    confidence: originSummary.sampleCount >= 3 ? 'HIGH' : originSummary.sampleCount >= 1 ? 'MEDIUM' : 'LOW'
                };

                opportunities.push(opportunity);
            });
        }
    });

    // Sort opportunities: Highest Net Profit & Strong Signals first
    opportunities.sort((a, b) => {
        if (a.netProfitToman !== b.netProfitToman) {
            return b.netProfitToman - a.netProfitToman;
        }
        return b.roiPercent - a.roiPercent;
    });

    return {
        opportunities,
        citySummariesByCar
    };
}

// Calculate custom user-adjusted deal in the simulator
export function calculateCustomDeal(input: CustomCalculatorInput): CarArbitrageOpportunity {
    const originConfig = ARBITRAGE_CITIES_CONFIG[input.originCity];
    const isLocal = input.originCity === 'shiraz';
    const carLabel = getCarLabelByKey(input.carKey);

    const grossSpreadToman = input.sellPriceShirazToman - input.buyPriceToman;
    const totalExpensesToman = input.carrierCostToman + input.inspectionCostToman + input.additionalCostsToman;
    const totalCapitalRequiredToman = input.buyPriceToman + totalExpensesToman;
    const netProfitToman = grossSpreadToman - totalExpensesToman;
    const roiPercent = totalCapitalRequiredToman > 0 
        ? Number(((netProfitToman / totalCapitalRequiredToman) * 100).toFixed(2))
        : 0;

    const riskAnalysis = evaluateArbitrageRisk(
        input.originCity,
        grossSpreadToman,
        netProfitToman,
        roiPercent,
        input.buyPriceToman || 1_000_000_000,
        3 // assumed user entered specific quote
    );

    const actionSummary = isLocal
        ? `معامله اختصاصی ${carLabel} در شیراز: خرید ${formatToman(input.buyPriceToman)} و فروش ${formatToman(input.sellPriceShirazToman)}`
        : `خرید اختصاصی ${carLabel} از ${originConfig.label} به قیمت ${formatToman(input.buyPriceToman)} و انتقال به شیراز جهت فروش ${formatToman(input.sellPriceShirazToman)}`;

    return {
        id: `custom-${input.carKey}-${input.originCity}-${Date.now()}`,
        carKey: input.carKey,
        carName: carLabel,
        tradeType: isLocal ? 'INTRA_CITY_SHIRAZ' : 'CROSS_CITY_ARBITRAGE',
        originCity: input.originCity,
        originCityLabel: originConfig.label,
        destinationCity: 'shiraz',
        destinationCityLabel: ARBITRAGE_CITIES_CONFIG.shiraz.label,
        distanceKm: originConfig.distanceToShirazKm,
        estimatedDays: input.estimatedDays,
        buyPriceToman: input.buyPriceToman,
        sellPriceShirazToman: input.sellPriceShirazToman,
        grossSpreadToman,
        carrierCostToman: input.carrierCostToman,
        inspectionCostToman: input.inspectionCostToman + input.additionalCostsToman,
        totalExpensesToman,
        totalCapitalRequiredToman,
        netProfitToman,
        roiPercent,
        riskLevel: riskAnalysis.riskLevel,
        riskScore: riskAnalysis.riskScore,
        riskFactors: riskAnalysis.riskFactors,
        signal: riskAnalysis.signal,
        signalLabel: riskAnalysis.signalLabel,
        actionSummary,
        originSampleCount: 1,
        shirazSampleCount: 1,
        confidence: 'HIGH'
    };
}
