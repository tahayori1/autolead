import {
    CommissionDeal,
    CommissionPeriod,
    CommissionCategory,
    CarYardItem,
    CommissionSettings,
    MonthlyCommissionTarget,
    CommissionTargetGoal,
    KaranehShareConfig,
    CommissionPayoutAdjustmentItem
} from '../types';

export const DEFAULT_KARANEH_SHARES: KaranehShareConfig[] = [
    { id: 'kr-1', recipientName: 'خانم زارع', mode: 'PERCENT', percent: 0.25 },
    { id: 'kr-2', recipientName: 'خانم یوسفی', mode: 'PERCENT', percent: 0.20 },
    { id: 'kr-3', recipientName: 'آقا سید', mode: 'PERCENT', percent: 0.20 },
    { id: 'kr-4', recipientName: 'آقای موسوی', mode: 'PERCENT', percent: 0.20 },
    { id: 'kr-5', recipientName: 'خانم منوچهری بزرگ', mode: 'PERCENT', percent: 0.15 },
];

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
    settingsVersion: 2,
    // پارامترهای سیستمی پیشنهادی به صورت اعشاری (0.05 = 5%)
    anbarRate: 0.05, // ۵٪ مابه‌التفاوت نرخ فروش و قیمت روز (ستون K شیت انبار)
    anbarIncentiveBonus: 50000000, // ۵۰,۰۰۰,۰۰۰ ریال پورسانت تشویقی انبار (ستون M شیت انبار)
    azadRate: 0.10, // ۱۰٪ سود برای معاملات عادی آزاد
    azadHardRate: 0.15, // ۱۵٪ سود برای ردیف‌های دارای «معاملات سخت»
    havalehRate: 0.10, // ۱۰٪ مابه‌التفاوت فروش و قیمت روز (ستون K شیت حواله)
    registrationRate: 0.09, // ۹٪ پیش‌پرداخت (ستون I شیت ثبت‌نام)
    leasingRate: null, // نامشخص - نیازمند تنظیم و تأیید مدیر
    leasingRateConfirmed: false,
    payoutHoldRate: 0.10, // سهم ۱۰٪ کمسیون نهایی در شیت پرداختی
    payoutHoldMode: 'DEDUCT', // کسر ۱۰٪ در شیت پرداختی (مگر اینکه کاربر حالت افزودن را انتخاب کند)
    karanehSectionCount: 4, // تعداد بخش‌ها برای محاسبه کارانه هر بخش
    karanehShares: DEFAULT_KARANEH_SHARES,

    // فیلدهای میراثی جهت سازگاری
    azadFlatRate: 0,
    azadKaranehDivisor: 4,
    lossPenaltyRate: 0,

    // حالت‌های پورسانت با عدد ثابت (اختیاری)
    anbarCalcType: 'PERCENT',
    anbarFixedAmount: 0,
    azadCalcType: 'PERCENT',
    azadFixedAmount: 0,
    havalehCalcType: 'PERCENT',
    havalehFixedAmount: 0,
    leasingCalcType: 'PERCENT',
    leasingFixedAmount: 0,
    registrationCalcType: 'PERCENT',
    registrationFixedAmount: 0
};

export const INITIAL_COMMISSION_PERIODS: CommissionPeriod[] = [];
export const INITIAL_COMMISSION_DEALS: CommissionDeal[] = [];
export const INITIAL_CAR_YARD_ITEMS: CarYardItem[] = [];

// ----------------------------------------------------
// Normalization, Parsing & Validation Helpers
// ----------------------------------------------------

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
export function toAsciiDigits(input?: string | number | null): string {
    if (input === undefined || input === null) return '';
    return String(input)
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * یکسان‌سازی نام پرسنل:
 * - حذف فاصله‌های ابتدا و انتها و فاصله‌های اضافه بین کلمات
 * - تبدیل ی/ک عربی به فارسی
 */
export function normalizePersonnelName(name?: string | null): string {
    if (!name) return '';
    return name
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/‌+/g, '‌')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * بررسی خالی بودن کامل یک ردیف معامله (جهت حذف از شیت نهایی)
 */
export function isDealRowEmpty(deal: Partial<CommissionDeal>): boolean {
    const hasPerson = normalizePersonnelName(deal.salesPerson).length > 0 ||
        (Array.isArray(deal.sharedPersons) && deal.sharedPersons.some(p => normalizePersonnelName(p).length > 0));
    const hasCar = (deal.carModel || '').trim().length > 0;
    const hasMoney = (deal.salePrice || 0) > 0 || (deal.purchasePrice || 0) > 0 || (deal.downPayment || 0) > 0 || (deal.commissionAmount || 0) > 0;
    const hasCustomer = (deal.customerName || deal.buyerName || deal.sellerName || '').trim().length > 0;
    return !hasPerson && !hasCar && !hasMoney && !hasCustomer;
}

/**
 * اعتبارسنجی ترتیب تاریخی: تاریخ فروش باید بزرگ‌تر یا مساوی تاریخ خرید باشد
 */
export function parseNumericDateTuple(dateStr?: string): number | null {
    if (!dateStr) return null;
    const clean = toAsciiDigits(dateStr).trim();
    if (!clean) return null;
    const parts = clean.split(/[-/.]/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return y * 10000 + m * 100 + d;
}

export function validateSalePurchaseDates(
    purchaseDate?: string,
    saleDate?: string
): { isValid: boolean; message?: string } {
    if (!purchaseDate || !saleDate) return { isValid: true };
    const pVal = parseNumericDateTuple(purchaseDate);
    const sVal = parseNumericDateTuple(saleDate);
    if (pVal === null || sVal === null) return { isValid: true };
    if (sVal < pVal) {
        return {
            isValid: false,
            message: `تاریخ فروش (${saleDate}) نمی‌تواند قبل از تاریخ خرید (${purchaseDate}) باشد.`
        };
    }
    return { isValid: true };
}

/**
 * تشخیص «معاملات سخت ۱۵٪» در فروش آزاد
 */
export function detectHardDeal(deal: Partial<CommissionDeal>): boolean {
    if (deal.isHardDeal) return true;
    const text = `${deal.paymentNotes || ''} ${deal.manualCommissionReason || ''} ${deal.carModel || ''}`;
    return /معاملات\s*سخت|معامله\s*سخت|سخت\s*15|سخت\s*۱۵/i.test(text);
}

/**
 * تشخیص Flag: «عدد نرخ خرید غیر واقعی است»
 */
export function detectUnrealisticPurchasePrice(deal: Partial<CommissionDeal>): boolean {
    if (deal.isUnrealisticPurchasePrice) return true;
    const text = `${deal.paymentNotes || ''} ${deal.manualCommissionReason || ''}`;
    return /عدد\s*نرخ\s*خرید\s*غیر\s*واقعی|نرخ\s*خرید\s*غیر\s*واقعی/i.test(text);
}

/**
 * جداسازی اسامی پرسنل در فیلدهای متنی (با / ، + و) و یکسان‌سازی آن‌ها
 */
export function parseSalesPersons(salesPersonStr?: string): string[] {
    if (!salesPersonStr) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    salesPersonStr
        .split(/[/،+&]|\s+و\s+/)
        .map(s => normalizePersonnelName(s))
        .filter(s => s.length > 0)
        .forEach(name => {
            if (!seen.has(name)) {
                seen.add(name);
                result.push(name);
            }
        });
    return result;
}

/**
 * استخراج پرسنل مشارکت‌کننده یک ردیف و محاسبه تعداد کل مشارکت‌کنندگان معامله (شامل ردیف‌های هم‌شناسه transactionId)
 */
export function getDealParticipantInfo(
    deal: Partial<CommissionDeal>,
    allDeals?: CommissionDeal[]
): {
    rowParticipants: string[];
    transactionParticipants: string[];
    participantCount: number;
    missingTransactionIdWarning: boolean;
} {
    const rowSet = new Set<string>();
    if (Array.isArray(deal.sharedPersons) && deal.sharedPersons.length > 0) {
        deal.sharedPersons.forEach(p => {
            const norm = normalizePersonnelName(p);
            if (norm) rowSet.add(norm);
        });
    } else {
        parseSalesPersons(deal.salesPerson).forEach(p => rowSet.add(p));
        if (deal.secondSalesPerson) {
            const p2 = normalizePersonnelName(deal.secondSalesPerson);
            if (p2) rowSet.add(p2);
        }
        if (deal.thirdSalesPerson) {
            const p3 = normalizePersonnelName(deal.thirdSalesPerson);
            if (p3) rowSet.add(p3);
        }
    }

    const rowParticipants = Array.from(rowSet);
    const txId = (deal.transactionId || '').trim();

    if (txId && Array.isArray(allDeals) && allDeals.length > 0) {
        const txSet = new Set<string>(rowParticipants);
        allDeals.forEach(other => {
            if ((other.transactionId || '').trim() === txId && other.periodId === deal.periodId) {
                if (Array.isArray(other.sharedPersons) && other.sharedPersons.length > 0) {
                    other.sharedPersons.forEach(p => {
                        const norm = normalizePersonnelName(p);
                        if (norm) txSet.add(norm);
                    });
                } else {
                    parseSalesPersons(other.salesPerson).forEach(p => txSet.add(p));
                    if (other.secondSalesPerson) {
                        const p2 = normalizePersonnelName(other.secondSalesPerson);
                        if (p2) txSet.add(p2);
                    }
                    if (other.thirdSalesPerson) {
                        const p3 = normalizePersonnelName(other.thirdSalesPerson);
                        if (p3) txSet.add(p3);
                    }
                }
            }
        });
        const transactionParticipants = Array.from(txSet);
        const participantCount = Math.max(1, transactionParticipants.length);
        return {
            rowParticipants,
            transactionParticipants,
            participantCount,
            missingTransactionIdWarning: false
        };
    }

    const participantCount = Math.max(1, rowParticipants.length);
    const missingTransactionIdWarning = rowParticipants.length > 1 && !txId;
    return {
        rowParticipants,
        transactionParticipants: rowParticipants,
        participantCount,
        missingTransactionIdWarning
    };
}

/**
 * تبدیل نرخ اعشاری (مثلاً 0.05) به عدد درصدی قابل نمایش برای کاربر (مثلاً 5)
 */
export function decimalToPercentNumber(decimalRate?: number | null): number {
    if (decimalRate === undefined || decimalRate === null || isNaN(decimalRate)) return 0;
    return Number((decimalRate * 100).toFixed(2));
}

/**
 * تبدیل عدد درصدی ورودی کاربر (مثلاً 5) به نرخ اعشاری سیستمی (مثلاً 0.05)
 */
export function percentNumberToDecimal(percentVal: number): number {
    if (isNaN(percentVal)) return 0;
    return Number((percentVal / 100).toFixed(6));
}

export function formatDecimalPercentLabel(decimalRate?: number | null): string {
    if (decimalRate === undefined || decimalRate === null || isNaN(decimalRate)) return 'نامشخص';
    const pct = decimalToPercentNumber(decimalRate);
    return `${pct.toLocaleString('fa-IR')}٪`;
}

// ----------------------------------------------------
// Calculation Engine (Sections 2 to 6 of Specification)
// ----------------------------------------------------

export interface DealFinancialCalculationResult {
    dailyProfitLoss: number;
    grossProfit: number;
    oldCommissionAmount: number;
    incentiveBonusAmount: number;
    commissionAmount: number;
    perPersonCommission: number;
    tenPercentCommission: number;
    effectiveRate: number; // stored as decimal e.g. 0.05, 0.10, 0.15, 0.09
    isLossPenalty: boolean;
    isHardDeal: boolean;
    isUnrealisticPurchasePrice: boolean;
    isDraftLeasing: boolean;
}

/**
 * محاسبه دقیق تمام اقلام مالی یک معامله طبق دستورالعمل نرم‌افزاری
 */
export function calculateDealFinancials(
    category: CommissionCategory,
    params: {
        salePrice?: number;
        purchasePrice?: number;
        dailyPrice?: number;
        nextBasketAmount?: number;
        downPayment?: number;
        participantCount?: number;
        isHardDeal?: boolean;
        isUnrealisticPurchasePrice?: boolean;
        managerApprovedUnrealistic?: boolean;
        paymentNotes?: string;
        manualCommissionReason?: string;
        carModel?: string;
    },
    customSettings?: CommissionSettings
): DealFinancialCalculationResult {
    const settings = customSettings || getCommissionSettings();
    const salePrice = Number(params.salePrice || 0);
    const purchasePrice = Number(params.purchasePrice || 0);
    const dailyPrice = Number(params.dailyPrice || 0);
    const downPayment = Number(params.downPayment || 0);
    const participantCount = Math.max(1, Math.round(Number(params.participantCount || 1)));

    const isHardDeal = category === 'AZAD' && detectHardDeal({
        isHardDeal: params.isHardDeal,
        paymentNotes: params.paymentNotes,
        manualCommissionReason: params.manualCommissionReason,
        carModel: params.carModel
    });

    const isUnrealisticPurchasePrice = detectUnrealisticPurchasePrice({
        isUnrealisticPurchasePrice: params.isUnrealisticPurchasePrice,
        paymentNotes: params.paymentNotes,
        manualCommissionReason: params.manualCommissionReason
    });

    let dailyProfitLoss = 0;
    let grossProfit = 0;
    let oldCommissionAmount = 0;
    let incentiveBonusAmount = 0;
    let commissionAmount = 0;
    let perPersonCommission = 0;
    let tenPercentCommission = 0;
    let effectiveRate = 0;
    let isDraftLeasing = false;
    const isLossPenalty = false;

    switch (category) {
        case 'ANBAR': {
            // شیت انبار:
            // J = نرخ فروش - نرخ خرید (سود یا زیان روز)
            // L = MAX(0, (نرخ فروش - قیمت روز) * نرخ پورسانت انبار ۵٪)
            // N = L + پورسانت تشویقی (۵۰,۰۰۰,۰۰۰ ریال)
            grossProfit = (salePrice > 0 || purchasePrice > 0) ? (salePrice - purchasePrice) : 0;
            dailyProfitLoss = grossProfit;

            if (settings.anbarCalcType === 'FIXED' && (settings.anbarFixedAmount ?? 0) > 0) {
                effectiveRate = 0;
                oldCommissionAmount = Math.round(settings.anbarFixedAmount!);
                incentiveBonusAmount = salePrice > 0 ? Math.round(settings.anbarIncentiveBonus ?? 50000000) : 0;
                commissionAmount = oldCommissionAmount + incentiveBonusAmount;
            } else {
                effectiveRate = settings.anbarRate ?? 0.05;
                const diffFromDaily = dailyPrice > 0 ? Math.max(0, salePrice - dailyPrice) : 0;
                oldCommissionAmount = Math.round(diffFromDaily * effectiveRate);
                incentiveBonusAmount = salePrice > 0 ? Math.round(settings.anbarIncentiveBonus ?? 50000000) : 0;
                commissionAmount = oldCommissionAmount + incentiveBonusAmount;
            }
            perPersonCommission = Math.round(commissionAmount / participantCount);
            tenPercentCommission = Math.round(perPersonCommission * (settings.payoutHoldRate ?? 0.10));
            break;
        }

        case 'AZAD': {
            // شیت آزاد:
            // K = نرخ فروش - نرخ خرید (سود)
            // نرخ = ۱۵٪ اگر معاملات سخت، وگرنه ۱۰٪
            // L = MAX(0, سود) * نرخ
            // M = L / تعداد پرسنل مشارکت‌کننده
            // O = M * 10%
            grossProfit = (salePrice > 0 || purchasePrice > 0) ? (salePrice - purchasePrice) : 0;
            dailyProfitLoss = grossProfit;

            if (settings.azadCalcType === 'FIXED' && (settings.azadFixedAmount ?? 0) > 0) {
                effectiveRate = 0;
                commissionAmount = Math.round(settings.azadFixedAmount!);
            } else {
                effectiveRate = isHardDeal ? (settings.azadHardRate ?? 0.15) : (settings.azadRate ?? 0.10);
                commissionAmount = Math.round(Math.max(0, grossProfit) * effectiveRate);
            }
            perPersonCommission = Math.round(commissionAmount / participantCount);
            tenPercentCommission = Math.round(perPersonCommission * 0.10);
            break;
        }

        case 'HAVALEH': {
            // شیت حواله:
            // J = نرخ فروش - نرخ خرید (سود و زیان)
            // K = MAX(0, نرخ فروش - قیمت روز) * ۱۰٪
            // L = K / تعداد پرسنل مشارکت‌کننده
            // نکته: مبلغ سبد بعدی در محاسبه استفاده نمی‌شود و فقط اطلاعاتی است.
            grossProfit = (salePrice > 0 || purchasePrice > 0) ? (salePrice - purchasePrice) : 0;
            dailyProfitLoss = grossProfit;

            if (settings.havalehCalcType === 'FIXED' && (settings.havalehFixedAmount ?? 0) > 0) {
                effectiveRate = 0;
                commissionAmount = Math.round(settings.havalehFixedAmount!);
            } else {
                effectiveRate = settings.havalehRate ?? 0.10;
                const diffFromDaily = dailyPrice > 0 ? Math.max(0, salePrice - dailyPrice) : 0;
                commissionAmount = Math.round(diffFromDaily * effectiveRate);
            }
            perPersonCommission = Math.round(commissionAmount / participantCount);
            tenPercentCommission = Math.round(perPersonCommission * (settings.payoutHoldRate ?? 0.10));
            break;
        }

        case 'REGISTRATION': {
            // شیت ثبت نام:
            // J = پیش‌پرداخت * درصد پورسانت (پیش‌فرض ۰.۰۹ = ۹٪)
            // K = J (یا ÷ تعداد پرسنل در صورت مشارکت چند نفر)
            grossProfit = 0;
            dailyProfitLoss = 0;
            if (settings.registrationCalcType === 'FIXED' && (settings.registrationFixedAmount ?? 0) > 0) {
                effectiveRate = 0;
                commissionAmount = Math.round(settings.registrationFixedAmount!);
            } else {
                effectiveRate = settings.registrationRate ?? 0.09;
                commissionAmount = Math.round(Math.max(0, downPayment) * effectiveRate);
            }
            perPersonCommission = Math.round(commissionAmount / participantCount);
            tenPercentCommission = Math.round(perPersonCommission * (settings.payoutHoldRate ?? 0.10));
            break;
        }

        case 'LEASING': {
            // شیت لیزینگ:
            // نرخ لیزینگ تا زمان تنظیم و تأیید توسط مدیر به صورت پیش‌نویس می‌ماند و در جمع قطعی لحاظ نمی‌شود
            grossProfit = 0;
            dailyProfitLoss = 0;
            if (settings.leasingCalcType === 'FIXED' && (settings.leasingFixedAmount ?? 0) > 0 && settings.leasingRateConfirmed) {
                effectiveRate = 0;
                commissionAmount = Math.round(settings.leasingFixedAmount!);
                perPersonCommission = Math.round(commissionAmount / participantCount);
                tenPercentCommission = Math.round(perPersonCommission * (settings.payoutHoldRate ?? 0.10));
                isDraftLeasing = false;
            } else if (settings.leasingRateConfirmed && settings.leasingRate !== null && settings.leasingRate !== undefined) {
                effectiveRate = settings.leasingRate;
                commissionAmount = Math.round(Math.max(0, downPayment) * effectiveRate);
                perPersonCommission = Math.round(commissionAmount / participantCount);
                tenPercentCommission = Math.round(perPersonCommission * (settings.payoutHoldRate ?? 0.10));
                isDraftLeasing = false;
            } else {
                isDraftLeasing = true;
                effectiveRate = 0;
                commissionAmount = 0;
                perPersonCommission = 0;
                tenPercentCommission = 0;
            }
            break;
        }
    }

    return {
        dailyProfitLoss,
        grossProfit,
        oldCommissionAmount,
        incentiveBonusAmount,
        commissionAmount,
        perPersonCommission,
        tenPercentCommission,
        effectiveRate,
        isLossPenalty,
        isHardDeal,
        isUnrealisticPurchasePrice,
        isDraftLeasing
    };
}

/**
 * Wrapper سازگار با امضای قبلی برای بخش‌هایی که فقط calculateCommissionForCategory را صدا می‌زنند
 */
export function calculateCommissionForCategory(
    category: CommissionCategory,
    params: {
        salePrice: number;
        purchasePrice?: number;
        dailyPrice?: number;
        nextBasketAmount?: number;
        downPayment?: number;
        commissionRate?: number;
        participantCount?: number;
        isHardDeal?: boolean;
        isUnrealisticPurchasePrice?: boolean;
        paymentNotes?: string;
        manualCommissionReason?: string;
        carModel?: string;
    },
    customSettings?: CommissionSettings
): DealFinancialCalculationResult {
    return calculateDealFinancials(category, params, customSettings);
}

/**
 * بازمحاسبه یک لیست از معاملات با تنظیمات جدید و اتصال ردیف‌های transactionId
 */
export function recalculateDealsWithSettings(
    deals: CommissionDeal[],
    customSettings?: CommissionSettings
): CommissionDeal[] {
    const settings = customSettings || getCommissionSettings();
    return deals.map(deal => {
        const partInfo = getDealParticipantInfo(deal, deals);
        const calc = calculateDealFinancials(
            deal.category,
            {
                salePrice: deal.salePrice,
                purchasePrice: deal.purchasePrice,
                dailyPrice: deal.dailyPrice,
                nextBasketAmount: deal.nextBasketAmount,
                downPayment: deal.downPayment,
                participantCount: partInfo.participantCount,
                isHardDeal: deal.isHardDeal,
                isUnrealisticPurchasePrice: deal.isUnrealisticPurchasePrice,
                managerApprovedUnrealistic: deal.managerApprovedUnrealistic,
                paymentNotes: deal.paymentNotes,
                manualCommissionReason: deal.manualCommissionReason,
                carModel: deal.carModel
            },
            settings
        );

        const nextCommission = deal.isManualCommission ? deal.commissionAmount : calc.commissionAmount;
        const nextPerPerson = deal.isManualCommission
            ? Math.round(nextCommission / partInfo.participantCount)
            : calc.perPersonCommission;
        const nextTenPercent = Math.round(nextPerPerson * 0.10);

        return {
            ...deal,
            dailyProfitLoss: calc.dailyProfitLoss,
            grossProfit: calc.grossProfit,
            oldCommissionAmount: calc.oldCommissionAmount,
            incentiveBonusAmount: calc.incentiveBonusAmount,
            commissionRate: deal.isManualCommission ? deal.commissionRate : calc.effectiveRate,
            commissionAmount: nextCommission,
            perPersonCommission: nextPerPerson,
            tenPercentCommission: nextTenPercent,
            isHardDeal: calc.isHardDeal,
            isUnrealisticPurchasePrice: calc.isUnrealisticPurchasePrice,
            isDraftLeasing: calc.isDraftLeasing,
            paidCommissionShare: deal.paymentStatus === 'PAID'
                ? nextPerPerson
                : (deal.paidCommissionShare ?? nextPerPerson)
        };
    });
}

// ----------------------------------------------------
// Sheet «نهایی», «پرداختی», and «کارانه» Aggregators
// ----------------------------------------------------

export interface PersonnelFinalRow {
    staffName: string;
    rank: number;
    anbarCommission: number;
    azadCommission: number;
    havalehCommission: number;
    registrationCommission: number;
    leasingCommission: number; // confirmed leasing
    draftLeasingCommission: number; // pending / unconfirmed leasing preview
    draftLeasingCount: number;
    flaggedExcludedAmount: number;
    flaggedExcludedCount: number;
    totalSheetCommission: number; // جمع پورسانت ۵ بخش قطعی
    giftAdjustment: number; // هدیه
    ceremonyAdjustment: number; // مراسم
    bonusAdjustment: number; // پاداش
    deductionsAdjustment: number; // کسورات
    netAdjustmentTotal: number; // مجموع تعدیل‌ها
    finalCommission: number; // نهایی = جمع پورسانت + مجموع تعدیل‌ها
    dealCount: number;
    salesVolume: number;
    grossProfit: number;
    paidAmount: number;
    remainingAmount: number;
    tenPercentReserve: number; // سهم ۱۰٪ (در صورت آزاد یا پرداختی)
    notes: string;
}

export interface PersonnelPayoutRow {
    staffName: string;
    rank: number;
    finalCommissionFromNahayi: number; // کمسیون نهایی از شیت نهایی
    tenPercentHold: number; // ۱۰٪ کمسیون نهایی
    holdMode: 'DEDUCT' | 'ADD';
    gift: number; // هدیه
    ceremony: number; // مراسم
    t9Backlog: number; // کمسیون T9 خرداد/معوقه
    optionCommission: number; // آپشن
    lateRegistration: number; // ثبت‌نام معوقه
    otherExtras: number; // سایر
    totalExtras: number;
    finalPayable: number; // نهایی پرداختی
    notes: string;
}

export interface KaranehRecipientRow {
    id: string;
    recipientName: string;
    mode: 'PERCENT' | 'FIXED';
    percent: number;
    fixedAmount: number;
    calculatedAmount: number;
}

export interface KaranehSummary {
    totalAzadFinalCommission: number; // کارانه کلی = جمع نهایی پورسانت‌های فروش آزاد
    sectionCount: number; // تعداد بخش‌ها
    perSectionKaraneh: number; // کارانه هر بخش = کارانه کلی ÷ تعداد بخش
    recipientShares: KaranehRecipientRow[];
    totalDistributedShares: number;
}

export interface PeriodSummaryResult {
    finalRows: PersonnelFinalRow[];
    payoutRows: PersonnelPayoutRow[];
    karaneh: KaranehSummary;
    totals: {
        anbar: number;
        azad: number;
        havaleh: number;
        registration: number;
        leasing: number;
        draftLeasingCount: number;
        flaggedUnrealisticCount: number;
        totalSheetCommission: number;
        totalAdjustments: number;
        totalFinalCommission: number;
        totalTenPercentHold: number;
        totalExtras: number;
        totalFinalPayable: number;
    };
}

/**
 * بررسی آیا معامله در جمع قطعی لحاظ می‌شود یا خیر
 */
export function isDealEligibleForConfirmedTotals(deal: CommissionDeal, settings?: CommissionSettings): {
    eligible: boolean;
    reason?: 'EMPTY' | 'UNREALISTIC_UNAPPROVED' | 'LEASING_DRAFT';
} {
    if (isDealRowEmpty(deal)) return { eligible: false, reason: 'EMPTY' };
    const isUnrealistic = detectUnrealisticPurchasePrice(deal);
    if (isUnrealistic && !deal.managerApprovedUnrealistic) {
        return { eligible: false, reason: 'UNREALISTIC_UNAPPROVED' };
    }
    const cfg = settings || getCommissionSettings();
    if (deal.category === 'LEASING' && (!cfg.leasingRateConfirmed || cfg.leasingRate === null || cfg.leasingRate === undefined)) {
        if (!(cfg.leasingCalcType === 'FIXED' && (cfg.leasingFixedAmount ?? 0) > 0 && cfg.leasingRateConfirmed)) {
            return { eligible: false, reason: 'LEASING_DRAFT' };
        }
    }
    return { eligible: true };
}

/**
 * محاسبه سهم یک فرد از یک معامله خاص
 */
export function getPersonCommissionShareForDeal(
    deal: CommissionDeal,
    personName: string,
    allDeals?: CommissionDeal[],
    settings?: CommissionSettings
): number {
    const normTarget = normalizePersonnelName(personName);
    if (!normTarget) return 0;

    if (deal.customPersonCommissions) {
        for (const [key, val] of Object.entries(deal.customPersonCommissions)) {
            if (normalizePersonnelName(key) === normTarget && typeof val === 'number') {
                return Math.round(val);
            }
        }
    }

    const partInfo = getDealParticipantInfo(deal, allDeals);
    if (!partInfo.rowParticipants.includes(normTarget)) {
        return 0;
    }

    if (typeof deal.perPersonCommission === 'number' && !isNaN(deal.perPersonCommission) && deal.perPersonCommission > 0) {
        // Check consistency with total participants
        return Math.round(deal.perPersonCommission);
    }

    const baseAmount = deal.commissionAmount || 0;
    return Math.round(baseAmount / Math.max(1, partInfo.participantCount));
}

/**
 * ساخت گزارش تجمیعی شیت «نهایی»، شیت «پرداختی» و جدول «کارانه» بر اساس قوانین جدید
 */
export function buildPersonnelFinalAndPayoutSummary(
    deals: CommissionDeal[],
    period?: CommissionPeriod | null,
    customSettings?: CommissionSettings
): PeriodSummaryResult {
    const settings = customSettings || getCommissionSettings();
    const adjustments = period?.adjustments || {};
    const payoutExtrasMap = period?.payoutExtras || {};

    interface StaffBucket {
        staffName: string;
        anbarCommission: number;
        azadCommission: number;
        havalehCommission: number;
        registrationCommission: number;
        leasingCommission: number;
        draftLeasingCommission: number;
        draftLeasingCount: number;
        flaggedExcludedAmount: number;
        flaggedExcludedCount: number;
        dealCount: number;
        salesVolume: number;
        grossProfit: number;
        paidAmount: number;
        tenPercentReserve: number;
    }

    const staffMap = new Map<string, StaffBucket>();

    const ensureStaff = (rawName: string): StaffBucket => {
        const name = normalizePersonnelName(rawName);
        let bucket = staffMap.get(name);
        if (!bucket) {
            bucket = {
                staffName: name,
                anbarCommission: 0,
                azadCommission: 0,
                havalehCommission: 0,
                registrationCommission: 0,
                leasingCommission: 0,
                draftLeasingCommission: 0,
                draftLeasingCount: 0,
                flaggedExcludedAmount: 0,
                flaggedExcludedCount: 0,
                dealCount: 0,
                salesVolume: 0,
                grossProfit: 0,
                paidAmount: 0,
                tenPercentReserve: 0
            };
            staffMap.set(name, bucket);
        }
        return bucket;
    };

    let draftLeasingCountGlobal = 0;
    let flaggedUnrealisticCountGlobal = 0;

    deals.forEach(deal => {
        if (isDealRowEmpty(deal)) return;

        const partInfo = getDealParticipantInfo(deal, deals);
        const rowPeople = partInfo.rowParticipants;
        if (rowPeople.length === 0) return;

        const eligibility = isDealEligibleForConfirmedTotals(deal, settings);
        if (!eligibility.eligible) {
            if (eligibility.reason === 'LEASING_DRAFT') draftLeasingCountGlobal += 1;
            if (eligibility.reason === 'UNREALISTIC_UNAPPROVED') flaggedUnrealisticCountGlobal += 1;
        }

        const shareFraction = 1 / Math.max(1, partInfo.participantCount);
        const dealVolumeShare = Math.round((deal.salePrice || deal.downPayment || 0) * shareFraction);
        const dealProfitShare = Math.round((deal.grossProfit ?? deal.dailyProfitLoss ?? 0) * shareFraction);

        rowPeople.forEach(personName => {
            const bucket = ensureStaff(personName);
            const personComm = getPersonCommissionShareForDeal(deal, personName, deals, settings);

            if (!eligibility.eligible) {
                if (eligibility.reason === 'LEASING_DRAFT') {
                    bucket.draftLeasingCount += 1;
                    bucket.draftLeasingCommission += personComm;
                } else if (eligibility.reason === 'UNREALISTIC_UNAPPROVED') {
                    bucket.flaggedExcludedCount += 1;
                    bucket.flaggedExcludedAmount += personComm;
                }
                return;
            }

            bucket.dealCount += shareFraction;
            bucket.salesVolume += dealVolumeShare;
            bucket.grossProfit += dealProfitShare;

            switch (deal.category) {
                case 'ANBAR':
                    bucket.anbarCommission += personComm;
                    break;
                case 'AZAD':
                    bucket.azadCommission += personComm;
                    bucket.tenPercentReserve += Math.round(personComm * 0.10);
                    break;
                case 'HAVALEH':
                    bucket.havalehCommission += personComm;
                    break;
                case 'REGISTRATION':
                    bucket.registrationCommission += personComm;
                    break;
                case 'LEASING':
                    bucket.leasingCommission += personComm;
                    break;
            }

            if (deal.paymentStatus === 'PAID') {
                const paidBase = deal.paidCommissionShare !== undefined
                    ? (rowPeople.length === 1 && partInfo.participantCount === 1
                        ? deal.paidCommissionShare
                        : Math.round(deal.paidCommissionShare / Math.max(1, rowPeople.length)))
                    : personComm;
                bucket.paidAmount += paidBase;
            } else if (deal.paymentStatus === 'PARTIAL') {
                const partialBase = Math.round((deal.paidCommissionShare || 0) / Math.max(1, rowPeople.length));
                bucket.paidAmount += partialBase;
            }
        });
    });

    // Include staff that might only have adjustments or payout extras
    Object.keys(adjustments).forEach(raw => {
        const norm = normalizePersonnelName(raw);
        if (norm) ensureStaff(norm);
    });
    Object.keys(payoutExtrasMap).forEach(raw => {
        const norm = normalizePersonnelName(raw);
        if (norm) ensureStaff(norm);
    });

    // Helper to lookup normalized record entries
    const findAdjustment = (normName: string) => {
        for (const [k, v] of Object.entries(adjustments)) {
            if (normalizePersonnelName(k) === normName) return v;
        }
        return { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' };
    };

    const findPayoutExtras = (normName: string): CommissionPayoutAdjustmentItem => {
        for (const [k, v] of Object.entries(payoutExtrasMap)) {
            if (normalizePersonnelName(k) === normName) return v;
        }
        return {};
    };

    const rawFinalRows: Omit<PersonnelFinalRow, 'rank'>[] = Array.from(staffMap.values())
        .filter(b =>
            b.anbarCommission > 0 ||
            b.azadCommission > 0 ||
            b.havalehCommission > 0 ||
            b.registrationCommission > 0 ||
            b.leasingCommission > 0 ||
            b.draftLeasingCount > 0 ||
            b.flaggedExcludedCount > 0 ||
            b.dealCount > 0 ||
            (findAdjustment(b.staffName).bonus || 0) !== 0 ||
            (findAdjustment(b.staffName).deductions || 0) !== 0 ||
            (findAdjustment(b.staffName).gift || 0) !== 0 ||
            (findAdjustment(b.staffName).ceremony || 0) !== 0
        )
        .map(b => {
            const adj = findAdjustment(b.staffName);
            const totalSheetCommission =
                b.anbarCommission +
                b.azadCommission +
                b.havalehCommission +
                b.registrationCommission +
                b.leasingCommission;

            const giftAdj = Number(adj.gift || 0);
            const ceremonyAdj = Number(adj.ceremony || 0);
            const bonusAdj = Number(adj.bonus || 0);
            const deductionsAdj = Number(adj.deductions || 0);
            const netAdjustmentTotal = giftAdj + ceremonyAdj + bonusAdj - deductionsAdj;
            const finalCommission = Math.max(0, totalSheetCommission + netAdjustmentTotal);
            const remainingAmount = Math.max(0, finalCommission - b.paidAmount);

            return {
                staffName: b.staffName,
                anbarCommission: b.anbarCommission,
                azadCommission: b.azadCommission,
                havalehCommission: b.havalehCommission,
                registrationCommission: b.registrationCommission,
                leasingCommission: b.leasingCommission,
                draftLeasingCommission: b.draftLeasingCommission,
                draftLeasingCount: b.draftLeasingCount,
                flaggedExcludedAmount: b.flaggedExcludedAmount,
                flaggedExcludedCount: b.flaggedExcludedCount,
                totalSheetCommission,
                giftAdjustment: giftAdj,
                ceremonyAdjustment: ceremonyAdj,
                bonusAdjustment: bonusAdj,
                deductionsAdjustment: deductionsAdj,
                netAdjustmentTotal,
                finalCommission,
                dealCount: b.dealCount,
                salesVolume: b.salesVolume,
                grossProfit: b.grossProfit,
                paidAmount: b.paidAmount,
                remainingAmount,
                tenPercentReserve: b.tenPercentReserve,
                notes: adj.notes || ''
            };
        });

    // Sort descending by finalCommission and assign standard competition rank (RANK in Excel)
    rawFinalRows.sort((a, b) => b.finalCommission - a.finalCommission);

    const finalRows: PersonnelFinalRow[] = rawFinalRows.map((row, idx) => {
        let rank = idx + 1;
        if (idx > 0 && row.finalCommission === rawFinalRows[idx - 1].finalCommission) {
            // match previous rank on tie
            let prevIdx = idx - 1;
            while (prevIdx > 0 && rawFinalRows[prevIdx - 1].finalCommission === row.finalCommission) {
                prevIdx--;
            }
            rank = prevIdx + 1;
        }
        return { ...row, rank };
    });

    // Sheet «پرداختی» (Monthly Payout Sheet)
    const holdRate = settings.payoutHoldRate ?? 0.10;
    const holdMode: 'DEDUCT' | 'ADD' = settings.payoutHoldMode === 'ADD' ? 'ADD' : 'DEDUCT';

    const payoutRows: PersonnelPayoutRow[] = finalRows.map(fr => {
        const extras = findPayoutExtras(fr.staffName);
        const gift = Number(extras.gift || 0);
        const ceremony = Number(extras.ceremony || 0);
        const t9Backlog = Number(extras.t9Backlog || 0);
        const optionCommission = Number(extras.optionCommission || 0);
        const lateRegistration = Number(extras.lateRegistration || 0);
        const otherExtras = Number(extras.other || 0);
        const totalExtras = gift + ceremony + t9Backlog + optionCommission + lateRegistration + otherExtras;

        const tenPercentHold = Math.round(fr.finalCommission * holdRate);
        const finalPayable = holdMode === 'ADD'
            ? fr.finalCommission + totalExtras + tenPercentHold
            : Math.max(0, fr.finalCommission + totalExtras - tenPercentHold);

        return {
            staffName: fr.staffName,
            rank: fr.rank,
            finalCommissionFromNahayi: fr.finalCommission,
            tenPercentHold,
            holdMode,
            gift,
            ceremony,
            t9Backlog,
            optionCommission,
            lateRegistration,
            otherExtras,
            totalExtras,
            finalPayable,
            notes: extras.notes || ''
        };
    });

    // کارانه کلی و کارانه هر بخش (طبق بخش ۸ دستورالعمل: کارانه کلی = جمع نهایی پورسانت‌های آزاد)
    const totalAzadFinalCommission = finalRows.reduce((s, r) => s + r.azadCommission, 0);
    const sectionCount = Math.max(1, Number(settings.karanehSectionCount ?? settings.azadKaranehDivisor ?? 4));
    const perSectionKaraneh = Math.round(totalAzadFinalCommission / sectionCount);

    const shareConfigs = (settings.karanehShares && settings.karanehShares.length > 0)
        ? settings.karanehShares
        : DEFAULT_KARANEH_SHARES;

    const recipientShares: KaranehRecipientRow[] = shareConfigs.map(cfg => {
        const pct = cfg.percent ?? 0;
        const fixed = cfg.fixedAmount ?? 0;
        const calculatedAmount = cfg.mode === 'FIXED'
            ? Math.round(fixed)
            : Math.round(perSectionKaraneh * pct);
        return {
            id: cfg.id,
            recipientName: cfg.recipientName,
            mode: cfg.mode,
            percent: pct,
            fixedAmount: fixed,
            calculatedAmount
        };
    });

    const totalDistributedShares = recipientShares.reduce((s, r) => s + r.calculatedAmount, 0);

    const totals = {
        anbar: finalRows.reduce((s, r) => s + r.anbarCommission, 0),
        azad: finalRows.reduce((s, r) => s + r.azadCommission, 0),
        havaleh: finalRows.reduce((s, r) => s + r.havalehCommission, 0),
        registration: finalRows.reduce((s, r) => s + r.registrationCommission, 0),
        leasing: finalRows.reduce((s, r) => s + r.leasingCommission, 0),
        draftLeasingCount: draftLeasingCountGlobal,
        flaggedUnrealisticCount: flaggedUnrealisticCountGlobal,
        totalSheetCommission: finalRows.reduce((s, r) => s + r.totalSheetCommission, 0),
        totalAdjustments: finalRows.reduce((s, r) => s + r.netAdjustmentTotal, 0),
        totalFinalCommission: finalRows.reduce((s, r) => s + r.finalCommission, 0),
        totalTenPercentHold: payoutRows.reduce((s, r) => s + r.tenPercentHold, 0),
        totalExtras: payoutRows.reduce((s, r) => s + r.totalExtras, 0),
        totalFinalPayable: payoutRows.reduce((s, r) => s + r.finalPayable, 0)
    };

    return {
        finalRows,
        payoutRows,
        karaneh: {
            totalAzadFinalCommission,
            sectionCount,
            perSectionKaraneh,
            recipientShares,
            totalDistributedShares
        },
        totals
    };
}

/**
 * تابع کمکی کارانه فروش آزاد (سازگار با بخش‌های تحلیلی)
 */
export function calculateAzadKaraneh(
    totalAzadFinalCommission: number,
    _legacySecondArg: number = 0,
    sectionCount: number = 4
): {
    surplus: number;
    karaneh: number;
    divisor: number;
    formulaText: string;
} {
    const d = sectionCount > 0 ? sectionCount : 4;
    const karaneh = Math.round(totalAzadFinalCommission / d);
    return {
        surplus: totalAzadFinalCommission,
        karaneh,
        divisor: d,
        formulaText: `${totalAzadFinalCommission.toLocaleString('fa-IR')} ÷ ${d.toLocaleString('fa-IR')}`
    };
}

// ----------------------------------------------------
// Sample Data (Consistent with the New Formulas)
// ----------------------------------------------------

export const DEFAULT_SAMPLE_MONTHLY_TARGET: MonthlyCommissionTarget = {
    title: 'تارگت فروش مرداد ماه',
    goals: [
        {
            id: 'goal-1',
            title: '۱. دو ثبت نام لیزینگ',
            category: 'LEASING',
            targetCount: 2,
            modelKeyword: '',
            rewardText: 'واریز پورسانت با ضریب طلایی'
        },
        {
            id: 'goal-2',
            title: '۲. فروش سه دستگاه خودروهای موجود انبار (مدل ۱۴۰۴ و ۱۴۰۵)',
            category: 'ANBAR',
            targetCount: 3,
            modelKeyword: '1404,1405,۱۴۰۴,۱۴۰۵',
            rewardText: 'پاداش ویژه تسریع در فروش انبار'
        },
        {
            id: 'goal-3',
            title: '۳. فروش سه دستگاه حواله ایگل',
            category: 'HAVALEH',
            targetCount: 3,
            modelKeyword: 'eagle,ایگل',
            rewardText: 'پاداش فروش حواله ایگل'
        }
    ],
    specialNotes: 'در ضمن کمیسیون دو دستگاه جی۴ مشکی ۱۴۰۴ و یک دستگاه ایگل مشکی ۱۴۰۴ آنی واریز خواهد شد.',
    instantPayoutModels: ['جی۴ مشکی ۱۴۰۴', 'ایگل مشکی ۱۴۰۴', 'j4', 'eagle'],
    announcedDate: '1405/05/01',
    status: 'ACTIVE'
};

export const SAMPLE_COMMISSION_PERIODS: CommissionPeriod[] = [
    {
        id: '1405-05',
        title: 'مرداد ۱۴۰۵',
        startDate: '1405/05/01',
        endDate: '1405/05/31',
        target: DEFAULT_SAMPLE_MONTHLY_TARGET,
        adjustments: {
            'درسا محمدی': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' },
            'ندا قاسمی': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' },
            'عرشیا عسکری': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' },
            'محمد مبین غلامی': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' },
            'طرلان منوچهری': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' },
            'شبنم کشاورز': { bonus: 0, deductions: 0, gift: 0, ceremony: 0, notes: '' }
        },
        payoutExtras: {}
    },
    {
        id: '1405-04',
        title: 'تیر ۱۴۰۵',
        startDate: '1405/04/01',
        endDate: '1405/04/31'
    }
];

export const SAMPLE_COMMISSION_DEALS: CommissionDeal[] = [
    // ۱. فروش انبار (۵٪ مابه‌التفاوت فروش و قیمت روز + ۵۰,۰۰۰,۰۰۰ ریال تشویقی)
    {
        id: 'deal-anbar-1',
        rowNumber: 1,
        transactionId: 'ANB-101',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        purchaseDate: '1405/05/02',
        saleDate: '1405/05/10',
        salesPerson: 'درسا محمدی',
        customerName: 'هدیه توکلی ریشهری',
        carModel: '(1405) eagle',
        purchasePrice: 31000000000,
        dailyPrice: 34000000000,
        salePrice: 34500000000,
        dailyProfitLoss: 3500000000,
        grossProfit: 3500000000,
        commissionRate: 0.05,
        oldCommissionAmount: 25000000,
        incentiveBonusAmount: 50000000,
        commissionAmount: 75000000,
        perPersonCommission: 75000000,
        tenPercentCommission: 7500000,
        paidCommissionShare: 75000000,
        paymentStatus: 'PAID',
        paymentNotes: 'پورسانت قدیم ۲۵ میلیون + تشویقی ۵۰ میلیون ریال'
    },
    {
        id: 'deal-anbar-2',
        rowNumber: 2,
        transactionId: 'ANB-102',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        purchaseDate: '1405/05/05',
        saleDate: '1405/05/12',
        salesPerson: 'طرلان منوچهری',
        customerName: 'شیما پیروانی نیا',
        carModel: '(1404) j4',
        purchasePrice: 32500000000,
        dailyPrice: 35000000000,
        salePrice: 35500000000,
        dailyProfitLoss: 3000000000,
        grossProfit: 3000000000,
        commissionRate: 0.05,
        oldCommissionAmount: 25000000,
        incentiveBonusAmount: 50000000,
        commissionAmount: 75000000,
        perPersonCommission: 75000000,
        tenPercentCommission: 7500000,
        paidCommissionShare: 75000000,
        paymentStatus: 'PAID',
        paymentDate: '1405/05/18',
        paymentNotes: 'تسویه کامل'
    },
    {
        id: 'deal-anbar-3',
        rowNumber: 3,
        transactionId: 'ANB-103',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        purchaseDate: '1405/05/10',
        saleDate: '1405/05/20',
        salesPerson: 'شبنم کشاورز',
        customerName: 'سید علیرضا سماچی',
        carModel: '(1405) eagle',
        purchasePrice: 21000000000,
        dailyPrice: 24250000000,
        salePrice: 24000000000,
        dailyProfitLoss: 3000000000,
        grossProfit: 3000000000,
        commissionRate: 0.05,
        oldCommissionAmount: 0,
        incentiveBonusAmount: 50000000,
        commissionAmount: 50000000,
        perPersonCommission: 50000000,
        tenPercentCommission: 5000000,
        paidCommissionShare: 50000000,
        paymentStatus: 'PAID',
        paymentNotes: 'فروش پایین‌تر از قیمت روز: پورسانت قدیم ۰ + تشویقی ۵۰ میلیون ریال'
    },

    // ۲. فروش آزاد (۱۰٪ سود عادی / ۱۵٪ معاملات سخت، تقسیم بر تعداد پرسنل)
    {
        id: 'deal-azad-1',
        rowNumber: 1,
        transactionId: 'AZD-201',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/01',
        saleDate: '1405/05/01',
        salesPerson: 'درسا محمدی / ندا قاسمی',
        sharedPersons: ['درسا محمدی', 'ندا قاسمی'],
        sellerName: 'علی هوشمند سروستانی',
        buyerName: 'کیانا نگهداری',
        customerName: 'کیانا نگهداری',
        carModel: '(1404) x3',
        purchasePrice: 31700000000,
        dailyPrice: 32000000000,
        salePrice: 32500000000,
        grossProfit: 800000000,
        dailyProfitLoss: 800000000,
        commissionRate: 0.10,
        commissionAmount: 80000000,
        perPersonCommission: 40000000,
        tenPercentCommission: 4000000,
        paidCommissionShare: 40000000,
        paymentStatus: 'PAID',
        paymentNotes: '۱۰٪ سود معامله عادی بین ۲ نفر (هر نفر ۴۰ میلیون ریال)'
    },
    {
        id: 'deal-azad-2',
        rowNumber: 2,
        transactionId: 'AZD-202',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/07',
        saleDate: '1405/05/07',
        salesPerson: 'محمد مبین غلامی / ندا قاسمی',
        sharedPersons: ['محمد مبین غلامی', 'ندا قاسمی'],
        sellerName: 'مسعود آزادی',
        buyerName: 'مریم منعمیان',
        customerName: 'مریم منعمیان',
        carModel: 'x5(1404)',
        purchasePrice: 66500000000,
        dailyPrice: 67000000000,
        salePrice: 67800000000,
        grossProfit: 1300000000,
        dailyProfitLoss: 1300000000,
        commissionRate: 0.15,
        isHardDeal: true,
        commissionAmount: 195000000,
        perPersonCommission: 97500000,
        tenPercentCommission: 9750000,
        paidCommissionShare: 97500000,
        paymentStatus: 'PAID',
        paymentNotes: 'معاملات سخت ۱۵٪ - تقسیم مساوی بین ۲ نفر (هر نفر ۹۷.۵ میلیون ریال)'
    },

    // ۳. فروش حواله (۱۰٪ مابه‌التفاوت فروش و قیمت روز ÷ تعداد پرسنل)
    {
        id: 'deal-havaleh-1',
        rowNumber: 1,
        transactionId: 'HAV-301',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'HAVALEH',
        purchaseDate: '1405/05/12',
        saleDate: '1405/05/18',
        salesPerson: 'محمد مبین غلامی / عرشیا عسکری',
        sharedPersons: ['محمد مبین غلامی', 'عرشیا عسکری'],
        customerName: 'فهمیه پیروی',
        carModel: '(1405) eagle',
        purchasePrice: 31000000000,
        dailyPrice: 33000000000,
        salePrice: 34500000000,
        nextBasketAmount: 36500000000,
        dailyProfitLoss: 3500000000,
        grossProfit: 3500000000,
        commissionRate: 0.10,
        commissionAmount: 150000000,
        perPersonCommission: 75000000,
        tenPercentCommission: 7500000,
        paidCommissionShare: 75000000,
        paymentStatus: 'PAID',
        paymentNotes: '۱۰٪ مابه‌التفاوت فروش و قیمت روز ÷ ۲ نفر (هر نفر ۷۵ میلیون ریال)'
    },
    {
        id: 'deal-havaleh-2',
        rowNumber: 2,
        transactionId: 'HAV-302',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'HAVALEH',
        purchaseDate: '1405/05/15',
        saleDate: '1405/05/20',
        salesPerson: 'عرشیا عسکری',
        customerName: 'پردیس زاهدی',
        carModel: '(1405) eagle',
        purchasePrice: 31000000000,
        dailyPrice: 33000000000,
        salePrice: 34000000000,
        nextBasketAmount: 36500000000,
        dailyProfitLoss: 3000000000,
        grossProfit: 3000000000,
        commissionRate: 0.10,
        commissionAmount: 100000000,
        perPersonCommission: 100000000,
        tenPercentCommission: 10000000,
        paidCommissionShare: 100000000,
        paymentStatus: 'PAID',
        paymentNotes: 'تک نفره: ۱۰۰ میلیون ریال'
    },

    // ۴. ثبت نام (۹٪ پیش‌پرداخت)
    {
        id: 'deal-reg-1',
        rowNumber: 1,
        transactionId: 'REG-401',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'REGISTRATION',
        saleDate: '1405/05/14',
        salesPerson: 'درسا محمدی',
        customerName: 'امیرحسین رضایی',
        contractNumber: '1405-8821',
        carModel: 'KMC X5',
        downPayment: 10000000000,
        commissionRate: 0.09,
        commissionAmount: 900000000,
        perPersonCommission: 900000000,
        tenPercentCommission: 90000000,
        paidCommissionShare: 900000000,
        paymentStatus: 'PENDING',
        paymentNotes: '۹٪ مبلغ پیش‌پرداخت'
    },

    // ۵. لیزینگ (پیش‌نویس تا زمان تعیین و تأیید نرخ لیزینگ)
    {
        id: 'deal-leasing-1',
        rowNumber: 1,
        transactionId: 'LSN-501',
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'LEASING',
        saleDate: '1405/05/07',
        salesPerson: 'عرشیا عسکری',
        customerName: 'سید صمد هاشمی',
        carModel: 'eagle',
        downPayment: 15000000000,
        commissionRate: 0,
        commissionAmount: 0,
        perPersonCommission: 0,
        tenPercentCommission: 0,
        isDraftLeasing: true,
        paidCommissionShare: 0,
        paymentStatus: 'PENDING',
        paymentNotes: 'پیش‌نویس - در انتظار تعیین و تأیید نرخ لیزینگ توسط مدیر'
    }
];

export const SAMPLE_CAR_YARD_ITEMS: CarYardItem[] = [
    {
        id: 'yard-1',
        rowNumber: 1,
        periodId: '1405-05',
        carModel: 'کی‌ام‌سی T9',
        carColor: 'مشکی متالیک',
        chassisNumber: 'NAG84930129',
        plateNumber: '۳۴ ایران ۷۲۶ ج ۱۸',
        ownerName: 'اکبر نجف آبادی پور',
        entryDate: '1405/05/18',
        releaseDate: '1405/05/22',
        storageLocation: 'نمایشگاه مرکزی',
        deliveredBy: 'محمد مبین غلامی',
        status: 'RELEASED',
        notes: 'ترخیص و تحویل خریدار شد'
    },
    {
        id: 'yard-2',
        rowNumber: 2,
        periodId: '1405-05',
        carModel: 'ایگل (Eagle)',
        carColor: 'سفید دوپوششه',
        chassisNumber: 'EAG93021948',
        plateNumber: '۶۸ ایران ۱۱۴ ص ۵۵',
        ownerName: 'هدیه توکلی ریشهری',
        entryDate: '1405/05/10',
        releaseDate: '1405/05/11',
        storageLocation: 'پارکینگ شماره ۱',
        deliveredBy: 'درسا محمدی',
        status: 'RELEASED',
        notes: 'تحویل پس از کارشناسی بدنه'
    },
    {
        id: 'yard-3',
        rowNumber: 3,
        periodId: '1405-05',
        carModel: 'جک J4',
        carColor: 'خاکستری تیره',
        chassisNumber: 'JAC48201948',
        plateNumber: '۹۱ ایران ۴۸۳ د ۲۲',
        ownerName: 'پریا توکلیان',
        entryDate: '1405/05/20',
        storageLocation: 'انبار حسینی خودرو',
        deliveredBy: 'طرلان منوچهری',
        status: 'PARKED',
        notes: 'موجود در پارکینگ امانی'
    }
];

// ----------------------------------------------------
// LocalStorage Helpers
// ----------------------------------------------------
const STORAGE_KEY_DEALS = 'autolead_commission_deals_v2';
const STORAGE_KEY_PERIODS = 'autolead_commission_periods_v2';
const STORAGE_KEY_YARD = 'autolead_car_yard_v2';
const STORAGE_KEY_SETTINGS = 'autolead_commission_settings_v1';

export function getCommissionSettings(): CommissionSettings {
    try {
        if (typeof localStorage === 'undefined') {
            return { ...DEFAULT_COMMISSION_SETTINGS };
        }
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
            const parsed = JSON.parse(stored);
            // مهاجرت خودکار از نسخه ۱ قدیمی به نسخه ۲ (نرخ‌های اعشاری جدید)
            if (parsed && parsed.settingsVersion === 2) {
                return { ...DEFAULT_COMMISSION_SETTINGS, ...parsed };
            }
            const migrated: CommissionSettings = { ...DEFAULT_COMMISSION_SETTINGS };
            saveCommissionSettings(migrated);
            return migrated;
        }
    } catch (e) {
        console.error('Failed to load commission settings', e);
    }
    return { ...DEFAULT_COMMISSION_SETTINGS };
}

export function saveCommissionSettings(settings: CommissionSettings): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...settings, settingsVersion: 2 }));
    } catch (e) {
        console.error('Failed to save commission settings', e);
    }
}

export function resetCommissionSettings(): CommissionSettings {
    const fresh = { ...DEFAULT_COMMISSION_SETTINGS };
    saveCommissionSettings(fresh);
    return fresh;
}

export function getCommissionDeals(): CommissionDeal[] {
    try {
        if (typeof localStorage === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY_DEALS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load commission deals', e);
    }
    return [];
}

export function saveCommissionDeals(deals: CommissionDeal[]): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
    } catch (e) {
        console.error('Failed to save commission deals', e);
    }
}

export function getCommissionPeriods(): CommissionPeriod[] {
    try {
        if (typeof localStorage === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY_PERIODS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load commission periods', e);
    }
    return [];
}

export function saveCommissionPeriods(periods: CommissionPeriod[]): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods));
    } catch (e) {
        console.error('Failed to save commission periods', e);
    }
}

export function getCarYardItems(): CarYardItem[] {
    try {
        if (typeof localStorage === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY_YARD);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load car yard items', e);
    }
    return [];
}

export function saveCarYardItems(items: CarYardItem[]): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_YARD, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save car yard items', e);
    }
}

export function deleteCommissionPeriod(periodId: string, deleteDeals: boolean = true): {
    periods: CommissionPeriod[];
    deals: CommissionDeal[];
} {
    const currentPeriods = getCommissionPeriods();
    const currentDeals = getCommissionDeals();

    const updatedPeriods = currentPeriods.filter(p => p.id !== periodId);
    const updatedDeals = deleteDeals ? currentDeals.filter(d => d.periodId !== periodId) : currentDeals;

    saveCommissionPeriods(updatedPeriods);
    if (deleteDeals) {
        saveCommissionDeals(updatedDeals);
    }

    return { periods: updatedPeriods, deals: updatedDeals };
}

export function clearPeriodDeals(periodId: string): CommissionDeal[] {
    const currentDeals = getCommissionDeals();
    const updatedDeals = currentDeals.filter(d => d.periodId !== periodId);
    saveCommissionDeals(updatedDeals);
    return updatedDeals;
}

export function clearAllCommissionData(): {
    periods: CommissionPeriod[];
    deals: CommissionDeal[];
    yard: CarYardItem[];
} {
    const emptyPeriods: CommissionPeriod[] = [];
    const emptyDeals: CommissionDeal[] = [];
    const emptyYard: CarYardItem[] = [];

    saveCommissionPeriods(emptyPeriods);
    saveCommissionDeals(emptyDeals);
    saveCarYardItems(emptyYard);

    return { periods: emptyPeriods, deals: emptyDeals, yard: emptyYard };
}

export function resetCommissionDataToDefaults(): {
    deals: CommissionDeal[];
    periods: CommissionPeriod[];
    yard: CarYardItem[];
} {
    return clearAllCommissionData();
}

export function loadSampleCommissionData(): {
    deals: CommissionDeal[];
    periods: CommissionPeriod[];
    yard: CarYardItem[];
} {
    saveCommissionPeriods(SAMPLE_COMMISSION_PERIODS);
    saveCommissionDeals(SAMPLE_COMMISSION_DEALS);
    saveCarYardItems(SAMPLE_CAR_YARD_ITEMS);
    return {
        deals: SAMPLE_COMMISSION_DEALS,
        periods: SAMPLE_COMMISSION_PERIODS,
        yard: SAMPLE_CAR_YARD_ITEMS
    };
}

// ----------------------------------------------------
// JSON Export & Import Functions
// ----------------------------------------------------

export function exportCommissionJSONData(activePeriodId?: string): void {
    const backup = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        system: 'AutoLead CRM - Commission & Deal Management',
        activePeriodId: activePeriodId || undefined,
        settings: getCommissionSettings(),
        periods: getCommissionPeriods(),
        deals: getCommissionDeals(),
        yardItems: getCarYardItems()
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    link.href = url;
    link.download = `commission_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function importCommissionJSONData(
    jsonData: any,
    mode: 'REPLACE_ALL' | 'APPEND' = 'REPLACE_ALL'
): {
    success: boolean;
    error?: string;
    periods: CommissionPeriod[];
    deals: CommissionDeal[];
    yard: CarYardItem[];
    settings?: CommissionSettings;
    activePeriodId?: string;
} {
    try {
        const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

        let importedPeriods: CommissionPeriod[] = [];
        let importedDeals: CommissionDeal[] = [];
        let importedYard: CarYardItem[] = [];
        let importedSettings: CommissionSettings | undefined = undefined;
        let activePeriodId: string | undefined = undefined;

        if (Array.isArray(parsed)) {
            importedDeals = parsed;
            const pIds = Array.from(new Set(importedDeals.map(d => d.periodId).filter(Boolean)));
            importedPeriods = pIds.map(id => ({ id, title: id }));
        } else if (parsed && typeof parsed === 'object') {
            importedPeriods = Array.isArray(parsed.periods) ? parsed.periods : [];
            importedDeals = Array.isArray(parsed.deals) ? parsed.deals : [];
            importedYard = Array.isArray(parsed.yardItems) ? parsed.yardItems : [];
            importedSettings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : undefined;
            activePeriodId = parsed.activePeriodId;
        } else {
            return {
                success: false,
                error: 'ساختار فایل JSON معتبر نیست.',
                periods: getCommissionPeriods(),
                deals: getCommissionDeals(),
                yard: getCarYardItems()
            };
        }

        let finalPeriods: CommissionPeriod[];
        let finalDeals: CommissionDeal[];
        let finalYard: CarYardItem[];

        if (mode === 'REPLACE_ALL') {
            finalPeriods = importedPeriods;
            finalDeals = importedDeals;
            finalYard = importedYard;
        } else {
            const currentPeriods = getCommissionPeriods();
            const currentDeals = getCommissionDeals();
            const currentYard = getCarYardItems();

            const existingPeriodIds = new Set(currentPeriods.map(p => p.id));
            const newPeriods = importedPeriods.filter(p => !existingPeriodIds.has(p.id));
            finalPeriods = [...currentPeriods, ...newPeriods];

            const existingDealIds = new Set(currentDeals.map(d => d.id));
            const newDeals = importedDeals.filter(d => !existingDealIds.has(d.id));
            finalDeals = [...newDeals, ...currentDeals];

            const existingYardIds = new Set(currentYard.map(y => y.id));
            const newYard = importedYard.filter(y => !existingYardIds.has(y.id));
            finalYard = [...newYard, ...currentYard];
        }

        saveCommissionPeriods(finalPeriods);
        saveCommissionDeals(finalDeals);
        saveCarYardItems(finalYard);
        if (importedSettings && importedSettings.settingsVersion === 2) {
            saveCommissionSettings(importedSettings);
        }

        return {
            success: true,
            periods: finalPeriods,
            deals: finalDeals,
            yard: finalYard,
            settings: importedSettings,
            activePeriodId: activePeriodId || (finalPeriods.length > 0 ? finalPeriods[0].id : undefined)
        };
    } catch (e: any) {
        return {
            success: false,
            error: e?.message || 'خطا در پردازش و بارگذاری داده‌های JSON',
            periods: getCommissionPeriods(),
            deals: getCommissionDeals(),
            yard: getCarYardItems()
        };
    }
}

// ----------------------------------------------------
// Target Management Helpers
// ----------------------------------------------------

export function savePeriodTarget(periodId: string, target: MonthlyCommissionTarget): CommissionPeriod[] {
    const periods = getCommissionPeriods();
    const updated = periods.map(p => {
        if (p.id === periodId) {
            return {
                ...p,
                target
            };
        }
        return p;
    });
    saveCommissionPeriods(updated);
    return updated;
}

export function calculateGoalProgress(goal: CommissionTargetGoal, periodDeals: CommissionDeal[]): {
    count: number;
    percentage: number;
    isCompleted: boolean;
    matchingDeals: CommissionDeal[];
} {
    const categoryMatches = (deal: CommissionDeal) => {
        if (!goal.category || goal.category === 'ANY') return true;
        return deal.category === goal.category;
    };

    const modelMatches = (deal: CommissionDeal) => {
        if (!goal.modelKeyword || !goal.modelKeyword.trim()) return true;
        const keywords = goal.modelKeyword.split(/[,،\s]+/).filter(Boolean);
        if (keywords.length === 0) return true;

        const carModelLower = (deal.carModel || '').toLowerCase();
        return keywords.some(k => carModelLower.includes(k.toLowerCase()));
    };

    const matchingDeals = periodDeals.filter(d => categoryMatches(d) && modelMatches(d));
    const count = matchingDeals.length;
    const target = goal.targetCount > 0 ? goal.targetCount : 1;
    const percentage = Math.min(100, Math.round((count / target) * 100));
    const isCompleted = count >= goal.targetCount;

    return {
        count,
        percentage,
        isCompleted,
        matchingDeals
    };
}

export function checkIfDealIsInstantPayout(deal: CommissionDeal, target?: MonthlyCommissionTarget): {
    isInstant: boolean;
    matchedReason?: string;
} {
    if (!target) return { isInstant: false };

    const carModel = (deal.carModel || '').toLowerCase();
    const notes = (deal.paymentNotes || '').toLowerCase();

    if (target.instantPayoutModels && target.instantPayoutModels.length > 0) {
        for (const item of target.instantPayoutModels) {
            const cleanItem = item.toLowerCase().trim();
            if (cleanItem && carModel.includes(cleanItem)) {
                return { isInstant: true, matchedReason: `تسویه آنی طبق تارگت ماهانه (${item})` };
            }
        }
    }

    if (
        (carModel.includes('j4') && (carModel.includes('1404') || carModel.includes('۱۴۰۴'))) ||
        (carModel.includes('eagle') || carModel.includes('ایگل')) ||
        notes.includes('واریز شد') ||
        notes.includes('آنی')
    ) {
        return { isInstant: true, matchedReason: 'کمیسیون واریز آنی' };
    }

    return { isInstant: false };
}
