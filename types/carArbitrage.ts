export type ArbitrageCityKey = 'shiraz' | 'tehran' | 'isfahan' | 'bushehr';

export interface ArbitrageCityConfig {
    key: ArbitrageCityKey;
    label: string;
    province: string;
    distanceToShirazKm: number; // کیلومتر مسافت تا شیراز
    estimatedTransportDays: number; // روزهای تخمینی حمل و تحویل
    defaultCarrierCostToman: number; // هزینه پیش‌فرض حمل خودروبر اختصاصی (تومان)
    defaultInspectionCostToman: number; // هزینه پیش‌فرض کارشناسی و انتقال سند (تومان)
    baseLogisticsRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    isMainHub?: boolean; // آیا دفتر اصلی است (شیراز = true)
}

export const ARBITRAGE_CITIES_CONFIG: Record<ArbitrageCityKey, ArbitrageCityConfig> = {
    shiraz: {
        key: 'shiraz',
        label: 'شیراز (مرجع اصلی و دفتر مرکزی)',
        province: 'فارس',
        distanceToShirazKm: 0,
        estimatedTransportDays: 0,
        defaultCarrierCostToman: 0,
        defaultInspectionCostToman: 2_500_000,
        baseLogisticsRisk: 'LOW',
        isMainHub: true
    },
    tehran: {
        key: 'tehran',
        label: 'تهران',
        province: 'تهران',
        distanceToShirazKm: 920,
        estimatedTransportDays: 2.5,
        defaultCarrierCostToman: 15_000_000,
        defaultInspectionCostToman: 4_000_000,
        baseLogisticsRisk: 'MEDIUM',
        isMainHub: false
    },
    isfahan: {
        key: 'isfahan',
        label: 'اصفهان',
        province: 'اصفهان',
        distanceToShirazKm: 485,
        estimatedTransportDays: 1.5,
        defaultCarrierCostToman: 9_500_000,
        defaultInspectionCostToman: 3_500_000,
        baseLogisticsRisk: 'LOW',
        isMainHub: false
    },
    bushehr: {
        key: 'bushehr',
        label: 'بوشهر',
        province: 'بوشهر',
        distanceToShirazKm: 295,
        estimatedTransportDays: 1,
        defaultCarrierCostToman: 6_500_000,
        defaultInspectionCostToman: 3_000_000,
        baseLogisticsRisk: 'LOW',
        isMainHub: false
    }
};

export type ArbitrageTradeType = 'CROSS_CITY_ARBITRAGE' | 'INTRA_CITY_SHIRAZ';
export type ArbitrageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ArbitrageSignal = 'STRONG_BUY' | 'BUY' | 'MODERATE' | 'AVOID';

export interface CityInquiryMeta {
    cityKey: ArbitrageCityKey;
    cityLabel: string;
    lastInquiredAt: string | null; // e.g. "۱۴:۳۲:۱۰" or ISO
    timeAgoText: string; // e.g. "۲ دقیقه پیش" or "هم‌اکنون"
    rawAdsCount: number;
    validAdsCount: number;
    outlierAdsCount: number;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string | null;
}

export interface CityPriceSummary {
    cityKey: ArbitrageCityKey;
    cityLabel: string;
    sampleCount: number;
    rawCount: number;
    outlierCount: number;
    minPriceToman: number;
    maxPriceToman: number;
    avgPriceToman: number;
    modePriceToman: number;
    medianPriceToman: number;
    trimmedMeanToman: number;
    effectiveBuyPriceToman: number; // قیمت خرید پیشنهادی نرمال‌شده (کف بهینه بازار)
    effectiveSellPriceToman: number; // قیمت فروش پیشنهادی نرمال‌شده (پرتکرارترین نرخ معامله)
    priceDeltaAgainstShirazToman: number; // اختلاف با قیمت مرجع شیراز (منفی یعنی ارزان‌تر از شیراز)
    lastUpdated?: string;
    inquiryTimestamp?: string;
    isNormalized: boolean;
    hasLiveData: boolean;
}

export interface CarArbitrageOpportunity {
    id: string;
    carKey: string;
    carName: string;
    tradeType: ArbitrageTradeType;
    originCity: ArbitrageCityKey;
    originCityLabel: string;
    destinationCity: ArbitrageCityKey; // همیشه شیراز
    destinationCityLabel: string;
    distanceKm: number;
    estimatedDays: number;
    
    // Financials (in Tomans)
    buyPriceToman: number;
    sellPriceShirazToman: number;
    grossSpreadToman: number; // sellPrice - buyPrice
    carrierCostToman: number; // هزینه حمل
    inspectionCostToman: number; // کارشناسی و محضر
    totalExpensesToman: number; // carrier + inspection
    totalCapitalRequiredToman: number; // buyPrice + expenses
    netProfitToman: number; // grossSpread - totalExpenses
    roiPercent: number; // (netProfit / totalCapitalRequired) * 100
    
    // Risk Analysis
    riskLevel: ArbitrageRiskLevel;
    riskScore: number; // 0 (بی‌خطر) تا 100 (بسیار پرریسک)
    riskFactors: string[];
    
    // Actionable Recommendation
    signal: ArbitrageSignal;
    signalLabel: string;
    actionSummary: string; // e.g. "خرید ایگل در تهران به قیمت ۱,۱۵۰ و فروش در شیراز به قیمت ۱,۲۱۰"
    
    // Confidence & Data Sources
    originSampleCount: number;
    shirazSampleCount: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CustomCalculatorInput {
    carKey: string;
    originCity: ArbitrageCityKey;
    buyPriceToman: number;
    sellPriceShirazToman: number;
    carrierCostToman: number;
    inspectionCostToman: number;
    additionalCostsToman: number;
    estimatedDays: number;
}
