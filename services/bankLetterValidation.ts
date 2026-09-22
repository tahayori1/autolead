import type { ShebaValidationResult, NationalCodeValidationResult } from '../types/bankLetter';

// --- Iranian Banks Directory based on Sheba 3-digit bank code ---
export interface BankDirectoryItem {
    code: string;
    name: string;
    englishName: string;
    shortName: string;
    themeColor: string;
}

export const IRANIAN_BANKS: Record<string, BankDirectoryItem> = {
    '010': { code: '010', name: 'بانک مرکزی جمهوری اسلامی ایران', englishName: 'Central Bank', shortName: 'مرکزی', themeColor: '#1e3a8a' },
    '011': { code: '011', name: 'بانک صنعت و معدن', englishName: 'Sanat va Madan Bank', shortName: 'صنعت و معدن', themeColor: '#78350f' },
    '012': { code: '012', name: 'بانک ملت', englishName: 'Mellat Bank', shortName: 'ملت', themeColor: '#b91c1c' },
    '013': { code: '013', name: 'بانک رفاه کارگران', englishName: 'Refah Bank', shortName: 'رفاه کارگران', themeColor: '#15803d' },
    '014': { code: '014', name: 'بانک مسکن', englishName: 'Maskan Bank', shortName: 'مسکن', themeColor: '#ea580c' },
    '015': { code: '015', name: 'بانک سپه', englishName: 'Sepah Bank', shortName: 'سپه', themeColor: '#eab308' },
    '016': { code: '016', name: 'بانک کشاورزی', englishName: 'Keshavarzi Bank', shortName: 'کشاورزی', themeColor: '#16a34a' },
    '017': { code: '017', name: 'بانک ملی ایران', englishName: 'Bank Melli Iran', shortName: 'ملی', themeColor: '#0369a1' },
    '018': { code: '018', name: 'بانک تجارت', englishName: 'Tejarat Bank', shortName: 'تجارت', themeColor: '#1d4ed8' },
    '019': { code: '019', name: 'بانک صادرات ایران', englishName: 'Bank Saderat Iran', shortName: 'صادرات', themeColor: '#1e40af' },
    '020': { code: '020', name: 'بانک توسعه صادرات', englishName: 'Export Development Bank', shortName: 'توسعه صادرات', themeColor: '#0d9488' },
    '021': { code: '021', name: 'پست بانک ایران', englishName: 'Post Bank', shortName: 'پست بانک', themeColor: '#047857' },
    '022': { code: '022', name: 'بانک توسعه تعاون', englishName: 'Tose-e Taavon Bank', shortName: 'توسعه تعاون', themeColor: '#0284c7' },
    '051': { code: '051', name: 'مؤسسه اعتباری توسعه', englishName: 'Tose-e Credit Inst', shortName: 'توسعه', themeColor: '#4f46e5' },
    '053': { code: '053', name: 'بانک کارآفرین', englishName: 'Karafarin Bank', shortName: 'کارآفرین', themeColor: '#059669' },
    '054': { code: '054', name: 'بانک پارسیان', englishName: 'Parsian Bank', shortName: 'پارسیان', themeColor: '#b45309' },
    '055': { code: '055', name: 'بانک اقتصاد نوین', englishName: 'Eghtesad Novin Bank', shortName: 'اقتصاد نوین', themeColor: '#7c3aed' },
    '056': { code: '056', name: 'بانک سامان', englishName: 'Saman Bank', shortName: 'سامان', themeColor: '#0284c7' },
    '057': { code: '057', name: 'بانک پاسارگاد', englishName: 'Pasargad Bank', shortName: 'پاسارگاد', themeColor: '#ca8a04' },
    '058': { code: '058', name: 'بانک سرمایه', englishName: 'Sarmayeh Bank', shortName: 'سرمایه', themeColor: '#2563eb' },
    '059': { code: '059', name: 'بانک سینا', englishName: 'Sina Bank', shortName: 'سینا', themeColor: '#0d9488' },
    '060': { code: '060', name: 'بانک قرض‌الحسنه مهر ایران', englishName: 'Mehr Iran Bank', shortName: 'مهر ایران', themeColor: '#16a34a' },
    '061': { code: '061', name: 'بانک شهر', englishName: 'City Bank', shortName: 'شهر', themeColor: '#dc2626' },
    '062': { code: '062', name: 'بانک آینده', englishName: 'Ayandeh Bank', shortName: 'آینده', themeColor: '#854d0e' },
    '063': { code: '063', name: 'بانک انصار', englishName: 'Ansar Bank', shortName: 'انصار', themeColor: '#1e3a8a' },
    '064': { code: '064', name: 'بانک گردشگری', englishName: 'Gardeshgari Bank', shortName: 'گردشگری', themeColor: '#9333ea' },
    '065': { code: '065', name: 'بانک حکمت ایرانیان', englishName: 'Hekmat Iranian Bank', shortName: 'حکمت', themeColor: '#15803d' },
    '066': { code: '066', name: 'بانک دی', englishName: 'Dey Bank', shortName: 'دی', themeColor: '#ea580c' },
    '069': { code: '069', name: 'بانک ایران زمین', englishName: 'Iran Zamin Bank', shortName: 'ایران زمین', themeColor: '#4338ca' },
    '070': { code: '070', name: 'بانک قرض‌الحسنه رسالت', englishName: 'Resalat Bank', shortName: 'رسالت', themeColor: '#059669' },
    '073': { code: '073', name: 'موسسه اعتباری کوثر', englishName: 'Kowsar Inst', shortName: 'کوثر', themeColor: '#3b82f6' },
    '075': { code: '075', name: 'موسسه اعتباری ملل', englishName: 'Melal Inst', shortName: 'ملل', themeColor: '#d97706' },
    '078': { code: '078', name: 'بانک خاورمیانه', englishName: 'Middle East Bank', shortName: 'خاورمیانه', themeColor: '#0f766e' },
    '079': { code: '079', name: 'موسسه اعتباری نور', englishName: 'Noor Inst', shortName: 'نور', themeColor: '#6366f1' },
    '080': { code: '080', name: 'موسسه اعتباری کاسپین', englishName: 'Caspian Inst', shortName: 'کاسپین', themeColor: '#047857' },
};

// Convert Persian / Arabic digits to Latin digits
export function toEnglishDigits(str: string | number): string {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    
    let result = s;
    for (let i = 0; i < 10; i++) {
        result = result.replace(persianNumbers[i], String(i)).replace(arabicNumbers[i], String(i));
    }
    return result;
}

// Convert English digits to Persian digits
export function toPersianDigits(str: string | number): string {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

/**
 * Validate Iranian National Code (کد ملی ۱۰ رقمی)
 * Algorithm: Modulo 11 check on 10 digits
 */
export function validateIranianNationalCode(code: string): NationalCodeValidationResult {
    const raw = toEnglishDigits(code).trim().replace(/\D/g, '');

    if (!raw) {
        return { isValid: false, cleanCode: '', errorMessage: 'کد ملی وارد نشده است.' };
    }

    if (raw.length !== 10) {
        return { 
            isValid: false, 
            cleanCode: raw, 
            errorMessage: `کد ملی باید دقیقاً ۱۰ رقم باشد (تعداد وارد شده: ${raw.length} رقم)` 
        };
    }

    // Check for repetitive digits (e.g. 0000000000, 1111111111, etc.)
    if (/^(\d)\1{9}$/.test(raw)) {
        return { isValid: false, cleanCode: raw, errorMessage: 'کد ملی وارد شده نامعتبر است (ارقام یکسان).' };
    }

    const checkDigit = parseInt(raw.charAt(9), 10);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(raw.charAt(i), 10) * (10 - i);
    }

    const remainder = sum % 11;
    const isValid = (remainder < 2 && checkDigit === remainder) || (remainder >= 2 && checkDigit === 11 - remainder);

    if (!isValid) {
        return { isValid: false, cleanCode: raw, errorMessage: 'کد ملی با الگوریتم احراز هویت همخوانی ندارد (نامعتبر است).' };
    }

    return { isValid: true, cleanCode: raw };
}

/**
 * Helper to compute ISO 7064 Modulo 97 on large digit strings
 */
function iso7064Mod97(digitString: string): number {
    let remainder = 0;
    for (let i = 0; i < digitString.length; i++) {
        remainder = (remainder * 10 + parseInt(digitString.charAt(i), 10)) % 97;
    }
    return remainder;
}

/**
 * Validate Iranian IBAN / Sheba (شماره شبا)
 * Accepts 24 numeric digits or 26 characters starting with 'IR'
 * Returns validation status, extracted bank info, formatted Sheba, and error reason.
 */
export function validateIranianSheba(shebaInput: string): ShebaValidationResult {
    if (!shebaInput) {
        return {
            isValid: false,
            rawDigits: '',
            formattedSheba: '',
            fullIban: '',
            bankInfo: null,
            errorMessage: 'شماره شبا وارد نشده است.'
        };
    }

    let clean = toEnglishDigits(shebaInput).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Strip 'IR' if present at start
    let rawDigits = clean;
    if (clean.startsWith('IR')) {
        rawDigits = clean.substring(2);
    }

    // Must be purely numeric now and exactly 24 digits
    if (!/^\d+$/.test(rawDigits)) {
        return {
            isValid: false,
            rawDigits,
            formattedSheba: rawDigits,
            fullIban: 'IR' + rawDigits,
            bankInfo: null,
            errorMessage: 'شماره شبا باید تنها شامل ارقام و پیشوند اختیاری IR باشد.'
        };
    }

    if (rawDigits.length !== 24) {
        return {
            isValid: false,
            rawDigits,
            formattedSheba: rawDigits,
            fullIban: 'IR' + rawDigits,
            bankInfo: null,
            errorMessage: `شماره شبا باید دقیقاً ۲۴ رقم باشد (تعداد وارد شده: ${rawDigits.length} رقم)`
        };
    }

    // Extract bank 3-digit identifier (digits index 2 to 4, i.e., positions 3,4,5 of the 24-digit string)
    // Structure: 2 digits check, 3 digits bank code, 19 digits account/type
    const bankCode = rawDigits.substring(2, 5);
    const bankInfo = IRANIAN_BANKS[bankCode] || {
        code: bankCode,
        name: `بانک ناشناخته (کد ${bankCode})`,
        englishName: 'Unknown Bank',
        shortName: `بانک ${bankCode}`,
        themeColor: '#64748b'
    };

    // Calculate IBAN checksum according to ISO 7064 Mod 97-10
    // Move IR (I=18, R=27) + first 2 check digits to end
    // Full IBAN: IR + rawDigits[0..1] (check digits) + rawDigits[2..23]
    // Verification format: rawDigits[2..23] + "18" + "27" + rawDigits[0..1]
    const rearranged = rawDigits.substring(2) + '1827' + rawDigits.substring(0, 2);
    const mod = iso7064Mod97(rearranged);

    const isValid = mod === 1;
    const formattedSheba = formatShebaBlocks(rawDigits);
    const fullIban = `IR${rawDigits}`;

    return {
        isValid,
        rawDigits,
        formattedSheba,
        fullIban,
        bankInfo,
        errorMessage: isValid ? undefined : 'شماره شبا بر اساس الگوریتم اعتبارسنجی بین‌المللی شبا (Mod 97) معتبر نیست.'
    };
}

/**
 * Formats 24-digit sheba with dashes or 4-digit blocks
 * Example: 5901-3010-0000-0003-5815-7511
 */
export function formatShebaBlocks(rawDigits: string): string {
    const d = toEnglishDigits(rawDigits).replace(/\D/g, '');
    const blocks: string[] = [];
    for (let i = 0; i < d.length; i += 4) {
        blocks.push(d.substring(i, i + 4));
    }
    return blocks.join('-');
}

/**
 * Format currency with commas (e.g. 25000000000 -> 25,000,000,000)
 */
export function formatCurrencyWithCommas(amount: number | string): string {
    if (amount === undefined || amount === null || amount === '') return '';
    const clean = toEnglishDigits(String(amount)).replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// --- Number to Persian Words (تبدیل عدد به حروف) ---
const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const thousandsScale = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون', 'کوآدریلیون'];

function convertThreeDigitGroupToWords(num: number): string {
    const parts: string[] = [];
    const h = Math.floor(num / 100);
    const rem = num % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;

    if (h > 0) parts.push(hundreds[h]);

    if (rem >= 10 && rem < 20) {
        parts.push(teens[rem - 10]);
    } else {
        if (t > 0) parts.push(tens[t]);
        if (o > 0) parts.push(ones[o]);
    }

    return parts.join(' و ');
}

/**
 * Convert number into fluent Persian Words
 * Example: 25000000000 -> "بیست و پنج میلیارد"
 */
export function numberToPersianWords(input: number | string): string {
    if (input === undefined || input === null || input === '') return '';
    const clean = toEnglishDigits(String(input)).replace(/\D/g, '');
    if (!clean || clean === '0') return 'صفر';

    // Break into groups of 3 digits from right
    const groups: number[] = [];
    let temp = clean;
    while (temp.length > 0) {
        const chunk = temp.slice(-3);
        groups.push(parseInt(chunk, 10));
        temp = temp.slice(0, -3);
    }

    const wordsParts: string[] = [];
    for (let i = groups.length - 1; i >= 0; i--) {
        const val = groups[i];
        if (val > 0) {
            const groupWords = convertThreeDigitGroupToWords(val);
            const scale = thousandsScale[i];
            wordsParts.push(scale ? `${groupWords} ${scale}` : groupWords);
        }
    }

    return wordsParts.join(' و ');
}

/**
 * Get comprehensive amount display in both Rials and Tomans with words
 */
export function getAmountDisplaySummary(amountRials: number | string): {
    formattedRials: string;
    formattedTomans: string;
    rialsInWords: string;
    tomansInWords: string;
} {
    const clean = toEnglishDigits(String(amountRials)).replace(/\D/g, '');
    const num = parseInt(clean, 10) || 0;
    const tomans = Math.floor(num / 10);

    const formattedRials = formatCurrencyWithCommas(num);
    const formattedTomans = formatCurrencyWithCommas(tomans);
    const rialsInWords = numberToPersianWords(num) + ' ریال';
    const tomansInWords = numberToPersianWords(tomans) + ' تومان';

    return {
        formattedRials,
        formattedTomans,
        rialsInWords,
        tomansInWords
    };
}
