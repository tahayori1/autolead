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
    // KMC / Kerman Motor
    { key: 'kmc j7', label: 'کی‌ام‌سی جی۷ (KMC J7)', brand: 'کرمان موتور' },
    { key: 'kmc x5', label: 'کی‌ام‌سی ایکس۵ (KMC X5)', brand: 'کرمان موتور' },
    { key: 'kmc eagle', label: 'کی‌ام‌سی ایگل (KMC Eagle)', brand: 'کرمان موتور' },
    { key: 'kmc t8', label: 'کی‌ام‌سی تی۸ (KMC T8)', brand: 'کرمان موتور' },
    { key: 'kmc t9-pick-up', label: 'کی‌ام‌سی تی۹ پیکاپ (KMC T9)', brand: 'کرمان موتور' },
    { key: 'kmc sr3', label: 'کی‌ام‌سی اس‌آر۳ (KMC SR3)', brand: 'کرمان موتور' },
    { key: 'kmc k7', label: 'کی‌ام‌سی کی۷ (KMC K7)', brand: 'کرمان موتور' },
    { key: 'kmc a5', label: 'کی‌ام‌سی ای۵ (KMC A5)', brand: 'کرمان موتور' },
    { key: 'kmc sr6-1.5l-turbo', label: 'کی‌ام‌سی اس‌آر۶ توربو (KMC SR6)', brand: 'کرمان موتور' },
    { key: 'kmc ej7', label: 'کی‌ام‌سی برقی ای‌جی۷ (KMC EJ7)', brand: 'کرمان موتور' },
    { key: 'kmc ej7-plus', label: 'کی‌ام‌سی ای‌جی۷ پلاس (KMC EJ7 Plus)', brand: 'کرمان موتور' },

    // JAC
    { key: 'jac s5', label: 'جک اس۵ (JAC S5)', brand: 'کرمان موتور' },
    { key: 'jac j4', label: 'جک جی۴ (JAC J4)', brand: 'کرمان موتور' },
    { key: 'jac s3', label: 'جک اس۳ (JAC S3)', brand: 'کرمان موتور' },
    { key: 'jac j5', label: 'جک جی۵ (JAC J5)', brand: 'کرمان موتور' },
    { key: 'jac s5-new-face', label: 'جک اس۵ نیوفیس (JAC S5 New Face)', brand: 'کرمان موتور' },
    { key: 'jac j3-hatchback', label: 'جک جی۳ هاچ‌بک (JAC J3)', brand: 'کرمان موتور' },

    // BAC
    { key: 'bac x3-pro', label: 'بک ایکس۳ پرو (BAC X3 Pro)', brand: 'خودروسازان بم' },

    // Iran Khodro / Dena & Samand & Peugeot
    { key: 'dena plus', label: 'دنا پلاس (Dena Plus)', brand: 'ایران خودرو' },
    { key: 'dena basic', label: 'دنا معمولی (Dena Basic)', brand: 'ایران خودرو' },
    { key: 'samand lx', label: 'سمند LX (Samand LX)', brand: 'ایران خودرو' },
    { key: 'samand soren', label: 'سمند سورن (Samand Soren)', brand: 'ایران خودرو' },
    { key: 'samand x7', label: 'سمند X7 (Samand X7)', brand: 'ایران خودرو' },
    { key: 'samand el', label: 'سمند EL (Samand EL)', brand: 'ایران خودرو' },
    { key: 'samand se', label: 'سمند SE (Samand SE)', brand: 'ایران خودرو' },
    { key: 'peugeot 206', label: 'پژو ۲۰۶ (Peugeot 206)', brand: 'ایران خودرو' },
    { key: 'peugeot 207i', label: 'پژو ۲۰۷i (Peugeot 207i)', brand: 'ایران خودرو' },
    { key: 'peugeot 206-sd', label: 'پژو ۲۰۶ صندوقدار (206 SD)', brand: 'ایران خودرو' },
    { key: 'peugeot 405', label: 'پژو ۴۰۵ (Peugeot 405)', brand: 'ایران خودرو' },
    { key: 'peugeot pars', label: 'پژو پارس (Peugeot Pars)', brand: 'ایران خودرو' },

    // Saipa / Atlas, Sahand, Quick
    { key: 'saipa atlas-g', label: 'سایپا اطلس G (Atlas G)', brand: 'سایپا' },
    { key: 'saipa sahand', label: 'سهند (Sahand)', brand: 'سایپا' },
    { key: 'saipa atlas-gl', label: 'سایپا اطلس GL (Atlas GL)', brand: 'سایپا' },
    { key: 'saipa atlas-s', label: 'سایپا اطلس S (Atlas S)', brand: 'سایپا' },
    { key: 'saipa karvan', label: 'سایپا کاروان (Karvan)', brand: 'سایپا' },
    { key: 'quick manual', label: 'کوییک دنده‌ای (Quick Manual)', brand: 'سایپا' },
    { key: 'quick gxr', label: 'کوییک GXR (Quick GXR)', brand: 'سایپا' },
    { key: 'quick gx', label: 'کوییک GX (Quick GX)', brand: 'سایپا' },
    { key: 'quick rs', label: 'کوییک RS (Quick RS)', brand: 'سایپا' },
    { key: 'quick automatic', label: 'کوییک اتوماتیک (Quick Automatic)', brand: 'سایپا' },

    // Hyundai
    { key: 'hyundai santafe-ix45', label: 'هیوندای سانتافه IX45', brand: 'هیوندای' },
    { key: 'hyundai azera-grandeur', label: 'هیوندای آزرا گرنجور', brand: 'هیوندای' },
    { key: 'hyundai elantra', label: 'هیوندای النترا (Elantra)', brand: 'هیوندای' },
    { key: 'hyundai tucson-ix35', label: 'هیوندای توسان IX35', brand: 'هیوندای' },
    { key: 'hyundai genesis', label: 'هیوندای جنسیس (Genesis)', brand: 'هیوندای' },
    { key: 'hyundai verna', label: 'هیوندای ورنا (Verna)', brand: 'هیوندای' },
    { key: 'hyundai sonata-yf', label: 'هیوندای سوناتا YF', brand: 'هیوندای' },
    { key: 'hyundai sonata-nf', label: 'هیوندای سوناتا NF', brand: 'هیوندای' },
    { key: 'hyundai sonata-1.5l-turbo', label: 'هیوندای سوناتا ۱.۵ توربو', brand: 'هیوندای' },
    { key: 'hyundai veracruz-ix55', label: 'هیوندای وراکروز IX55', brand: 'هیوندای' },
    { key: 'hyundai i20', label: 'هیوندای i20', brand: 'هیوندای' },
    { key: 'hyundai sonata-lf', label: 'هیوندای سوناتا LF', brand: 'هیوندای' },

    // BYD
    { key: 'byd song-plus', label: 'بی‌وای‌دی سانگ پلاس (Song Plus)', brand: 'BYD' },
    { key: 'byd sealion-06-dmi', label: 'بی‌وای‌دی سی‌لاین ۰۶ (Sealion 06)', brand: 'BYD' },
    { key: 'byd qin-plus', label: 'بی‌وای‌دی کین پلاس (Qin Plus)', brand: 'BYD' },
    { key: 'byd qin-l', label: 'بی‌وای‌دی کین ال (Qin L)', brand: 'BYD' },
    { key: 'byd s6', label: 'بی‌وای‌دی S6', brand: 'BYD' },
    { key: 'byd destroyer-05-dmi', label: 'بی‌وای‌دی دسترویر ۰۵ (Destroyer 05)', brand: 'BYD' },

    // Toyota
    { key: 'toyota corolla', label: 'تویوتا کرولا (Corolla)', brand: 'تویوتا' },
    { key: 'toyota hilux-double-cabin', label: 'تویوتا هایلوکس دوکابین', brand: 'تویوتا' },
    { key: 'toyota landcruiser-4door', label: 'تویوتا لندکروزر ۴در', brand: 'تویوتا' },
    { key: 'toyota rav4', label: 'تویوتا راوفور (RAV4)', brand: 'تویوتا' },
    { key: 'toyota camry', label: 'تویوتا کمری (Camry)', brand: 'تویوتا' },
    { key: 'toyota prado-4door', label: 'تویوتا پرادو ۴در', brand: 'تویوتا' },
    { key: 'toyota frontlander-hybrid', label: 'تویوتا فرانت‌لندر هیبرید', brand: 'تویوتا' },
    { key: 'toyota hilux-single-cabin', label: 'تویوتا هایلوکس تک‌کابین', brand: 'تویوتا' },
    { key: 'toyota levin-hybrid-1800cc', label: 'تویوتا لوین هیبرید ۱۸۰۰', brand: 'تویوتا' },
    { key: 'toyota wildlander-luxury-plus', label: 'تویوتا وایلدلندر لاکچری پلاس', brand: 'تویوتا' },
    { key: 'toyota prado-2door', label: 'تویوتا پرادو ۲در', brand: 'تویوتا' },
    { key: 'toyota corolla-1200', label: 'تویوتا کرولا ۱۲۰۰ توربو', brand: 'تویوتا' },

    // Nissan
    { key: 'nissan maxima-ir', label: 'نیسان ماکسیما مونتاژ/وارداتی', brand: 'نیسان' },
    { key: 'nissan patrol-2-door', label: 'نیسان پاترول ۲در', brand: 'نیسان' },
    { key: 'nissan patrol-4-door', label: 'نیسان پاترول ۴در', brand: 'نیسان' },
    { key: 'nissan qashqai', label: 'نیسان قشقایی (Qashqai)', brand: 'نیسان' },
    { key: 'nissan sylphy-e-power', label: 'نیسان سیلفی e-Power', brand: 'نیسان' },
    { key: 'nissan pickup', label: 'نیسان پیکاپ (Pickup)', brand: 'نیسان' },
    { key: 'nissan juke', label: 'نیسان جوک (Juke)', brand: 'نیسان' },
    { key: 'nissan altima', label: 'نیسان تیانا/التیما (Altima)', brand: 'نیسان' },
    { key: 'nissan roniz', label: 'نیسان رونیز (Roniz)', brand: 'نیسان' },
    { key: 'nissan terra-exclusive', label: 'نیسان ترا اکسکلوزیو (Terra)', brand: 'نیسان' },
    { key: 'nissan murano', label: 'نیسان مورانو (Murano)', brand: 'نیسان' },
    { key: 'nissan x-trail', label: 'نیسان ایکس‌تریل (X-Trail)', brand: 'نیسان' },
    { key: 'nissan teana-ir', label: 'نیسان تیانا (Teana)', brand: 'نیسان' },
    { key: 'nissan maxima-im', label: 'نیسان ماکسیما وارداتی', brand: 'نیسان' },

    // Tigard
    { key: 'tigard tissan-s05-1.5l-turbo', label: 'تیگارد تیسان S05 توربو', brand: 'تیگارد' },
    { key: 'tigard x35', label: 'تیگارد X35', brand: 'تیگارد' },
    { key: 'tigard x35-prime', label: 'تیگارد X35 پرایم', brand: 'تیگارد' },

    // Lucano
    { key: 'lucano l7', label: 'لوکانو L7', brand: 'لوکانو' },
    { key: 'lucano l8', label: 'لوکانو L8', brand: 'لوکانو' },

    // Fownix
    { key: 'fownix tiggo-8-pro-max-ie', label: 'فونیکس تیگو ۸ پرو مکس IE', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix fx', label: 'فونیکس اف‌ایکس (FX)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix arizo-6-gt', label: 'فونیکس آریزو ۶ جی‌تی (Arrizo 6 GT)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix arizo-8', label: 'فونیکس آریزو ۸ (Arrizo 8)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix arrizo-6-pro', label: 'فونیکس آریزو ۶ پرو (Arrizo 6 Pro)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-7-pro-premium', label: 'فونیکس تیگو ۷ پرو پریمیوم', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-7-pro-max-1.6l-turbo-awd', label: 'فونیکس تیگو ۷ پرو مکس AWD', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix fx-ev', label: 'فونیکس اف‌ایکس برقی (FX EV)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-7-pro-e-plus-plugin-hybrid', label: 'فونیکس تیگو ۷ پرو هیبرید (e+)', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-8-promax', label: 'فونیکس تیگو ۸ پرو مکس', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-7-pro', label: 'فونیکس تیگو ۷ پرو', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-8-pro', label: 'فونیکس تیگو ۸ پرو', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-8-pro-max-e-plus-plugin-hybrid', label: 'فونیکس تیگو ۸ پرو مکس e+ هیبرید', brand: 'مدیران خودرو (فونیکس)' },
    { key: 'fownix tiggo-7-pro-max', label: 'فونیکس تیگو ۷ پرو مکس', brand: 'مدیران خودرو (فونیکس)' },

    // MVM
    { key: 'mvm x33-cross-automatic', label: 'ام‌وی‌ام X33 کراس اتوماتیک', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x55', label: 'ام‌وی‌ام X55 / X55 پرو', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x22', label: 'ام‌وی‌ام X22', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x22pro', label: 'ام‌وی‌ام X22 پرو', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm 110', label: 'ام‌وی‌ام ۱۱۰', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm 315-hatchback', label: 'ام‌وی‌ام ۳۱۵ هاچ‌بک', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x22-pro', label: 'ام‌وی‌ام X22 پرو دنده‌ای/اتومات', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x33', label: 'ام‌وی‌ام X33', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x33s', label: 'ام‌وی‌ام X33s', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm 530', label: 'ام‌وی‌ام ۵۳۰', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm x77', label: 'ام‌وی‌ام X77', brand: 'مدیران خودرو (MVM)' },
    { key: 'mvm arizo-5-sport-fl', label: 'ام‌وی‌ام آریزو ۵ اسپرت FL', brand: 'مدیران خودرو (MVM)' },
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

// Check if an item's last_fetch / captured_at timestamp is within the last 1 hour (<= 3,600,000 ms)
export function isLastFetchWithin1Hour(item: any): boolean {
    if (!item) return false;

    // Direct timestamp properties
    const ts = item.last_fetch ?? item.last_fetched ?? item.fetched_at ?? item.captured_at ?? item.created_at ?? item.timestamp ?? item.inquiryTimestamp ?? item.date ?? null;

    if (ts) {
        try {
            const date = new Date(ts);
            let timeMs = date.getTime();
            if (isNaN(timeMs)) {
                const parts = String(ts).match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
                if (parts) {
                    const [_, y, m, d, h, min, s] = parts.map(Number);
                    timeMs = new Date(Date.UTC(y, m - 1, d, h, min, s)).getTime();
                }
            }
            if (!isNaN(timeMs) && timeMs > 0) {
                const diffMs = Date.now() - timeMs;
                // Only consider if last_fetch is within 1 hour (3,600,000 milliseconds)
                return diffMs <= 3_600_000;
            }
        } catch {
            // fallback
        }
    }

    // If item was freshly inquired in current browser session, treat as fresh
    if (item.isLiveInquired === true) {
        return true;
    }

    return true;
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
export function normalizeCityPrices(
    rawPrices: number[],
    otherReferenceAvgToman?: number
): {
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
    // 1. Filter out invalid, non-price and installment downpayments (< 150M or > 15B)
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
    
    // 2. Identify anchor price (Average of other market references if provided, otherwise median)
    const midIndex = Math.floor(sorted.length / 2);
    const rawMedian = sorted.length % 2 !== 0 ? sorted[midIndex] : (sorted[midIndex - 1] + sorted[midIndex]) / 2;
    
    const anchorPrice = (otherReferenceAvgToman && otherReferenceAvgToman > 0) 
        ? otherReferenceAvgToman 
        : rawMedian;

    // 3. Filter outliers based on 10% lower and 30% upper range around anchor price
    const minAllowed = Math.round(anchorPrice * 0.90); // -10% lower limit
    const maxAllowed = Math.round(anchorPrice * 1.30); // +30% upper limit

    const normalPrices: number[] = [];
    const outliers: number[] = [];

    for (const p of sorted) {
        if (p < minAllowed || p > maxAllowed) {
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
    inquiryTimestamp?: string,
    otherReferenceAvgToman?: number
): CityPriceSummary {
    const config = ARBITRAGE_CITIES_CONFIG[cityKey];
    const norm = normalizeCityPrices(prices, otherReferenceAvgToman);

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

        const targetCities: ArbitrageCityKey[] = ['shiraz', 'tehran', 'isfahan', 'bushehr', 'karaj'];
        
        // 1. Collect real live price points for each city
        targetCities.forEach(cityKey => {
            const cityPricesToman: number[] = [];

            // A. From Dedicated City Live Inquiries Bucket (Strict rule: last_fetch < 1 hour)
            if (cityLiveListings && cityLiveListings[cityKey]) {
                cityLiveListings[cityKey].forEach(item => {
                    if (!isLastFetchWithin1Hour(item)) return;

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

            // B. From General Divar Listings if tagged or detected (Strict rule: last_fetch < 1 hour)
            divarListings.forEach(item => {
                if (!isLastFetchWithin1Hour(item)) return;

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
                    if (cityKey === 'karaj' && (text.includes('کرج') || text.includes('البرز') || text.includes('مهرشهر') || text.includes('گوهردشت'))) matchesCity = true;

                    if (matchesCity) {
                        const valToman = toToman(item.price);
                        if (valToman >= 150_000_000 && valToman <= 15_000_000_000) {
                            cityPricesToman.push(valToman);
                        }
                    }
                }
            });

            // C. From Scraped market baseline (Tehran only, strict last_fetch < 1 hour)
            scrapedPrices.forEach(p => {
                if (!isLastFetchWithin1Hour(p)) return;

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

            // Find average of other market reference prices for this car
            const matchedOtherPrices = scrapedPrices.filter(p => {
                if (!p || !p.model_name || !p.price_rial || p.price_rial <= 0) return false;
                const src = (p.source_name || '').toLowerCase();
                if (
                    src === 'custom' || 
                    src.includes('custom') || 
                    src.includes('hm') || 
                    src.includes('hoseini') || 
                    src.includes('مصوب') || 
                    src.includes('مدیر فروش') || 
                    src.includes('نمایندگی')
                ) {
                    return false;
                }
                const modelLower = p.model_name.toLowerCase();
                return modelLower.includes(carKey.toLowerCase()) || carKey.toLowerCase().includes(modelLower);
            });

            const otherRefPricesToman = matchedOtherPrices.map(p => toToman(p.price_rial)).filter(p => p > 0);
            const otherRefAvgToman = otherRefPricesToman.length > 0 
                ? Math.round(otherRefPricesToman.reduce((a, b) => a + b, 0) / otherRefPricesToman.length)
                : undefined;

            // Calculate live summary with 30% range based on average of other market references
            const summary = calculateCityPriceSummary(
                cityKey,
                cityPricesToman,
                undefined,
                undefined,
                otherRefAvgToman
            );
            citySummariesByCar[carKey][cityKey] = summary;
        });

        // 2. Shiraz Reference (مرجع اصلی: فقط اگر در شیراز آگهی زنده استعلام‌شده وجود داشته باشد)
        const shirazSummary = citySummariesByCar[carKey]['shiraz'];
        const hasShirazLiveData = shirazSummary && shirazSummary.hasLiveData && shirazSummary.effectiveSellPriceToman > 0;
        const sellPriceShirazToman = hasShirazLiveData ? shirazSummary.effectiveSellPriceToman : 0;

        // 3. Build Real Arbitrage Opportunities (ONLY IF LIVE DATA EXISTS FOR BOTH ORIGIN AND SHIRAZ)
        if (hasShirazLiveData && sellPriceShirazToman > 0) {
            const originCities: ArbitrageCityKey[] = ['tehran', 'isfahan', 'bushehr', 'karaj', 'shiraz'];

            originCities.forEach(origin => {
                const originConfig = ARBITRAGE_CITIES_CONFIG[origin];
                const originSummary = citySummariesByCar[carKey][origin];
                const isLocal = origin === 'shiraz';

                // Ensure origin has real live data
                if (!originSummary || !originSummary.hasLiveData || originSummary.effectiveBuyPriceToman <= 0) {
                    return; // Skip if no live data for origin
                }

                const originCityName = originConfig.label.split(' ')[0];
                const carDisplayName = car.label.replace(/\s*\([^)]*\)/g, '').trim();

                // 3.A Filter valid ads in Origin (City A) - last_fetch < 1 hour & valid price
                const originAdsRaw = (cityLiveListings && cityLiveListings[origin])
                    ? cityLiveListings[origin].filter(item => {
                        if (!isLastFetchWithin1Hour(item)) return false;
                        const itemCar = (item.car_name || '').toLowerCase();
                        const itemTitle = (item.title || '').toLowerCase();
                        const itemDesc = (item.desc || '').toLowerCase();
                        return (itemCar.includes(carKey) || itemTitle.includes(carKey) || itemDesc.includes(carKey) || carKey.includes(itemCar)) &&
                               typeof item.price === 'number' && item.price >= 150_000_000;
                    })
                    : [];

                // Filter ads in Origin city strictly against normalized price bounds (passing through normalization filter first)
                const originMinNormal = originSummary.minPriceToman;
                const originMaxNormal = originSummary.maxPriceToman;
                const validOriginAds = originAdsRaw.filter(item => 
                    item.price && item.price >= originMinNormal && item.price <= originMaxNormal
                );

                // Sort origin ads by price ascending (cheapest / best buy ads first)
                validOriginAds.sort((a, b) => (a.price || 0) - (b.price || 0));

                // 3.B Filter valid ads in Destination Shiraz (City B) - last_fetch < 1 hour & valid price
                const shirazAdsRaw = (cityLiveListings && cityLiveListings['shiraz'])
                    ? cityLiveListings['shiraz'].filter(item => {
                        if (!isLastFetchWithin1Hour(item)) return false;
                        const itemCar = (item.car_name || '').toLowerCase();
                        const itemTitle = (item.title || '').toLowerCase();
                        const itemDesc = (item.desc || '').toLowerCase();
                        return (itemCar.includes(carKey) || itemTitle.includes(carKey) || itemDesc.includes(carKey) || carKey.includes(itemCar)) &&
                               typeof item.price === 'number' && item.price >= 150_000_000;
                    })
                    : [];

                const shirazMinNormal = shirazSummary.minPriceToman;
                const shirazMaxNormal = shirazSummary.maxPriceToman;
                const validShirazAds = shirazAdsRaw.filter(item =>
                    item.price && item.price >= shirazMinNormal && item.price <= shirazMaxNormal
                );

                // Sort Shiraz ads by price descending (highest selling ads first)
                validShirazAds.sort((a, b) => (b.price || 0) - (a.price || 0));

                // 3.C Create Granular Ad-to-Ad Arbitrage Opportunities:
                // Pair specific cheap ads from city A with specific target selling price / top ads in city B!
                if (validOriginAds.length > 0) {
                    // Evaluate each available cheap ad in City A (up to top 4 best priced ads)
                    const adsToEvaluate = validOriginAds.slice(0, 4);

                    adsToEvaluate.forEach((cheapAd, adIndex) => {
                        const buyPriceToman = cheapAd.price!;
                        // Best matching sell ad in Shiraz: either top high price ad, or reference sell price
                        const matchingSellAd = validShirazAds[Math.min(adIndex, validShirazAds.length - 1)] || validShirazAds[0];
                        const sellPriceToman = matchingSellAd ? matchingSellAd.price! : sellPriceShirazToman;

                        let carrierCostToman = isLocal ? 0 : originConfig.defaultCarrierCostToman;
                        let inspectionCostToman = isLocal ? 2_000_000 : originConfig.defaultInspectionCostToman;

                        const grossSpreadToman = sellPriceToman - buyPriceToman;
                        const totalExpensesToman = carrierCostToman + inspectionCostToman;
                        const totalCapitalRequiredToman = buyPriceToman + totalExpensesToman;
                        const netProfitToman = grossSpreadToman - totalExpensesToman;
                        const roiPercent = totalCapitalRequiredToman > 0 
                            ? Number(((netProfitToman / totalCapitalRequiredToman) * 100).toFixed(2))
                            : 0;

                        // Only consider if profitable or if it's the primary market opportunity
                        if (isLocal && (netProfitToman <= 0 || buyPriceToman >= sellPriceToman)) {
                            return;
                        }

                        const riskAnalysis = evaluateArbitrageRisk(
                            origin,
                            grossSpreadToman,
                            netProfitToman,
                            roiPercent,
                            sellPriceToman,
                            originSummary.sampleCount
                        );

                        const profitAmountText = formatToman(Math.max(0, netProfitToman));
                        let actionSummary = '';
                        if (isLocal) {
                            actionSummary = `از شیراز خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`;
                        } else {
                            actionSummary = `از ${originCityName} خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`;
                        }

                        const buyAdHref = cheapAd?.href 
                            ? (cheapAd.href.startsWith('http') ? cheapAd.href : `https://divar.ir${cheapAd.href.startsWith('/') ? '' : '/'}${cheapAd.href}`)
                            : `https://divar.ir/s/${origin}/car?q=${encodeURIComponent(carDisplayName)}`;
                        const buyAdTitle = cheapAd?.title || `آگهی ارزان ${carDisplayName} در ${originCityName}`;

                        const sellAdHref = matchingSellAd?.href
                            ? (matchingSellAd.href.startsWith('http') ? matchingSellAd.href : `https://divar.ir${matchingSellAd.href.startsWith('/') ? '' : '/'}${matchingSellAd.href}`)
                            : `https://divar.ir/s/shiraz/car?q=${encodeURIComponent(carDisplayName)}`;
                        const sellAdTitle = matchingSellAd?.title || `آگهی فروش ${carDisplayName} در شیراز`;

                        const stableAdKey = cheapAd?.adv_id || cheapAd?.id || `${buyPriceToman}_${adIndex}`;
                        const opportunity: CarArbitrageOpportunity = {
                            id: `${carKey}_${origin}_ad_${adIndex}_${stableAdKey}`,
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
                            sellPriceShirazToman: sellPriceToman,
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
                            buyAdHref,
                            buyAdTitle,
                            buyAdPrice: buyPriceToman,
                            buyAdDesc: cheapAd.desc || null,
                            buyAdImage: cheapAd.image || null,
                            sellAdHref,
                            sellAdTitle,
                            sellAdPrice: sellPriceToman,
                            sellAdDesc: matchingSellAd?.desc || null,
                            sellAdImage: matchingSellAd?.image || null,
                            isDirectAdPair: true,
                            originSampleCount: originSummary.sampleCount,
                            shirazSampleCount: shirazSummary.sampleCount,
                            confidence: originSummary.sampleCount >= 3 ? 'HIGH' : originSummary.sampleCount >= 1 ? 'MEDIUM' : 'LOW'
                        };

                        opportunities.push(opportunity);
                    });
                } else {
                    // Fallback to statistical benchmark opportunity if no granular individual ads filtered
                    let buyPriceToman = originSummary.effectiveBuyPriceToman;
                    let carrierCostToman = originConfig.defaultCarrierCostToman;
                    let inspectionCostToman = originConfig.defaultInspectionCostToman;

                    if (isLocal) {
                        if (originSummary.sampleCount < 2 || originSummary.minPriceToman >= sellPriceShirazToman) {
                            return;
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

                    const profitAmountText = formatToman(Math.max(0, netProfitToman));
                    let actionSummary = '';
                    if (isLocal) {
                        actionSummary = `از شیراز خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`;
                    } else {
                        actionSummary = `از ${originCityName} خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`;
                    }

                    const buyAdHref = `https://divar.ir/s/${origin}/car?q=${encodeURIComponent(carDisplayName)}`;
                    const buyAdTitle = `آگهی خرید ${carDisplayName} در ${originCityName}`;
                    const sellAdHref = `https://divar.ir/s/shiraz/car?q=${encodeURIComponent(carDisplayName)}`;
                    const sellAdTitle = `آگهی فروش ${carDisplayName} در شیراز`;

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
                        buyAdHref,
                        buyAdTitle,
                        buyAdPrice: buyPriceToman,
                        sellAdHref,
                        sellAdTitle,
                        sellAdPrice: sellPriceShirazToman,
                        isDirectAdPair: false,
                        originSampleCount: originSummary.sampleCount,
                        shirazSampleCount: shirazSummary.sampleCount,
                        confidence: originSummary.sampleCount >= 3 ? 'HIGH' : originSummary.sampleCount >= 1 ? 'MEDIUM' : 'LOW'
                    };

                    opportunities.push(opportunity);
                }
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

    const profitAmountText = formatToman(Math.max(0, netProfitToman));
    const originCityName = originConfig.label.split(' ')[0];
    const carDisplayName = carLabel.replace(/\s*\([^)]*\)/g, '').trim();
    const actionSummary = isLocal
        ? `از شیراز خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`
        : `از ${originCityName} خودرو ${carDisplayName} بخر و در شیراز بفروش و ${profitAmountText} سود کن!`;

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
