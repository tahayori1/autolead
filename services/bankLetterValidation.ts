import type { 
    ShebaValidationResult, 
    NationalCodeValidationResult,
    PostalCodeValidationResult,
    MobileValidationResult,
    IranianPlateParts,
    PlateValidationResult
} from '../types/bankLetter';

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

// --- Province zones based on 2-digit postal prefix ---
const IRAN_POSTAL_PROVINCES: Record<string, string> = {
    '11': 'تهران (مرکزی)',
    '12': 'تهران',
    '13': 'تهران (جنوب)',
    '14': 'تهران (شمال و غرب)',
    '15': 'تهران (شرق)',
    '16': 'تهران (شمیرانات)',
    '17': 'تهران (جنوب شرق)',
    '18': 'تهران (شهر ری)',
    '19': 'تهران (شمال)',
    '31': 'البرز (کرج)',
    '32': 'البرز',
    '33': 'البرز (هشتگرد/نظرآباد)',
    '34': 'قزوین',
    '35': 'سمنان',
    '36': 'سمنان (شاهرود)',
    '37': 'قم',
    '38': 'مرکزی (اراک)',
    '39': 'مرکزی (ساوه)',
    '41': 'گیلان (رشت)',
    '42': 'گیلان',
    '43': 'گیلان (لاهیجان/انزلی)',
    '44': 'گلستان (گرگان)',
    '45': 'زنجان',
    '46': 'گلستان (گنبد کاووس)',
    '47': 'مازندران (ساری)',
    '48': 'مازندران (بابل/آمل)',
    '49': 'مازندران (غرب استان)',
    '51': 'آذربایجان شرقی (تبریز)',
    '52': 'آذربایجان شرقی (مراغه)',
    '53': 'آذربایجان شرقی (مرند)',
    '54': 'اردبیل',
    '55': 'اردبیل (پارس‌آباد)',
    '56': 'اردبیل (مشگین‌شهر)',
    '57': 'آذربایجان غربی (ارومیه)',
    '58': 'آذربایجان غربی (خوی/ماکو)',
    '59': 'آذربایجان غربی (مهاباد)',
    '61': 'خوزستان (اهواز)',
    '62': 'خوزستان (آبادان/خرمشهر)',
    '63': 'خوزستان (دزفول)',
    '64': 'خوزستان (ماهشهر)',
    '65': 'همدان',
    '66': 'کرمانشاه',
    '67': 'کرمانشاه',
    '68': 'لرستان (خرم‌آباد)',
    '69': 'لرستان (بروجرد)',
    '71': 'فارس (شیراز)',
    '72': 'فارس (کازرون/مرودشت)',
    '73': 'فارس (جهرم/فسا/لارستان)',
    '74': 'فارس (آباده/اقلید)',
    '75': 'بوشهر',
    '76': 'کرمان',
    '77': 'هرمزگان (بندرعباس)',
    '78': 'یزد',
    '79': 'کهگیلویه و بویراحمد (یاسوج)',
    '81': 'اصفهان',
    '82': 'اصفهان (کاشان)',
    '83': 'اصفهان (نجف‌آباد)',
    '84': 'ایلام',
    '85': 'سیستان و بلوچستان (زاهدان)',
    '86': 'چهارمحال و بختیاری (شهرکرد)',
    '87': 'کردستان (سنندج)',
    '88': 'چهارمحال و بختیاری',
    '91': 'خراسان رضوی (مشهد)',
    '92': 'خراسان رضوی (نیشابور/سبزوار)',
    '93': 'خراسان رضوی (تربت حیدریه)',
    '94': 'خراسان شمالی (بجنورد)',
    '97': 'خراسان جنوبی (بیرجند)',
    '98': 'سیستان و بلوچستان (زابل)',
    '99': 'سیستان و بلوچستان (چابهار/ایرانشهر)'
};

/**
 * Validate Iranian 10-Digit Postal Code (کد پستی ۱۰ رقمی)
 * Rules:
 * - Exactly 10 digits
 * - Does not start with '0' or '2'
 * - 5th digit is not '0' or '2'
 * - Not all identical digits
 */
export function validateIranianPostalCode(postalCode: string): PostalCodeValidationResult {
    if (!postalCode) {
        return {
            isValid: false,
            cleanCode: '',
            formattedCode: '',
            errorMessage: 'کد پستی وارد نشده است.'
        };
    }

    const raw = toEnglishDigits(postalCode).trim().replace(/\D/g, '');

    if (!raw) {
        return {
            isValid: false,
            cleanCode: '',
            formattedCode: '',
            errorMessage: 'کد پستی باید تنها شامل اعداد باشد.'
        };
    }

    if (raw.length !== 10) {
        return {
            isValid: false,
            cleanCode: raw,
            formattedCode: raw,
            errorMessage: `کد پستی باید دقیقاً ۱۰ رقم باشد (وارد شده: ${raw.length} رقم)`
        };
    }

    // Check repeated digits (e.g. 1111111111)
    if (/^(\d)\1{9}$/.test(raw)) {
        return {
            isValid: false,
            cleanCode: raw,
            formattedCode: raw,
            errorMessage: 'کد پستی نامعتبر است (تمام ارقام یکسان هستند).'
        };
    }

    // First digit cannot be 0 or 2 in Iran Post
    const firstDigit = raw.charAt(0);
    if (firstDigit === '0' || firstDigit === '2') {
        return {
            isValid: false,
            cleanCode: raw,
            formattedCode: raw,
            errorMessage: `کد پستی نمی‌تواند با رقم '${firstDigit}' شروع شود (رقم اول باید از ۱، ۳ تا ۹ باشد).`
        };
    }

    // 5th digit (divider between zone and house code) is not 0 or 2
    const fifthDigit = raw.charAt(4);
    if (fifthDigit === '0' || fifthDigit === '2') {
        return {
            isValid: false,
            cleanCode: raw,
            formattedCode: raw,
            errorMessage: `رقم پنجم کد پستی نمی‌تواند '${fifthDigit}' باشد.`
        };
    }

    const prefix2 = raw.substring(0, 2);
    const provinceHint = IRAN_POSTAL_PROVINCES[prefix2] || 'ایران';
    const formattedCode = `${raw.substring(0, 5)}-${raw.substring(5)}`;

    return {
        isValid: true,
        cleanCode: raw,
        formattedCode,
        provinceHint
    };
}

/**
 * Validate Iranian Mobile Phone Number (شماره موبایل ایران)
 * Accepts formats: 0917..., +98917..., 0098917..., 98917..., 917...
 * Returns valid status, normalized 11-digit number, formatted view, and operator name.
 */
export function validateIranianMobile(mobile: string): MobileValidationResult {
    if (!mobile) {
        return {
            isValid: false,
            cleanNumber: '',
            formattedNumber: '',
            errorMessage: 'شماره موبایل وارد نشده است.'
        };
    }

    let clean = toEnglishDigits(mobile).trim().replace(/[^\d+]/g, '');

    // Normalize international prefixes
    if (clean.startsWith('+98')) {
        clean = '0' + clean.substring(3);
    } else if (clean.startsWith('0098')) {
        clean = '0' + clean.substring(4);
    } else if (clean.startsWith('98') && clean.length === 12) {
        clean = '0' + clean.substring(2);
    } else if (clean.startsWith('9') && clean.length === 10) {
        clean = '0' + clean;
    }

    // Strip any remaining non-digits
    clean = clean.replace(/\D/g, '');

    if (!clean) {
        return {
            isValid: false,
            cleanNumber: '',
            formattedNumber: '',
            errorMessage: 'شماره موبایل باید شامل ارقام باشد.'
        };
    }

    if (clean.length !== 11) {
        return {
            isValid: false,
            cleanNumber: clean,
            formattedNumber: clean,
            errorMessage: `شماره موبایل باید ۱۱ رقم باشد (وارد شده: ${clean.length} رقم)`
        };
    }

    if (!clean.startsWith('09')) {
        return {
            isValid: false,
            cleanNumber: clean,
            formattedNumber: clean,
            errorMessage: 'شماره تلفن همراه در ایران باید با ۰۹ شروع شود.'
        };
    }

    // Check for repetitive/fake numbers (e.g. 09111111111, 09000000000)
    const afterPrefix = clean.substring(2);
    if (/^(\d)\1{8}$/.test(afterPrefix)) {
        return {
            isValid: false,
            cleanNumber: clean,
            formattedNumber: clean,
            errorMessage: 'شماره موبایل وارد شده فاقد ساختار معتبر است.'
        };
    }

    // Operator Detection
    const prefix4 = clean.substring(0, 4);
    let operatorName = 'اپراتور همراه';
    let operatorColor = '#3b82f6';

    const mciPrefixes = [
        '0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919',
        '0990', '0991', '0992', '0993', '0994', '0996'
    ];
    const mtnPrefixes = [
        '0930', '0933', '0935', '0936', '0937', '0938', '0939',
        '0901', '0902', '0903', '0904', '0905', '0941'
    ];
    const rightelPrefixes = ['0920', '0921', '0922', '0923'];
    const otherPrefixes: Record<string, string> = {
        '0998': 'شاتل موبایل',
        '0999': 'سامانتل / آپتل',
        '0932': 'تالیا'
    };

    if (mciPrefixes.includes(prefix4)) {
        operatorName = 'همراه اول (MCI)';
        operatorColor = '#0284c7';
    } else if (mtnPrefixes.includes(prefix4)) {
        operatorName = 'ایرانسل (Irancell)';
        operatorColor = '#ca8a04';
    } else if (rightelPrefixes.includes(prefix4)) {
        operatorName = 'رایتل (Rightel)';
        operatorColor = '#9333ea';
    } else if (otherPrefixes[prefix4]) {
        operatorName = otherPrefixes[prefix4];
        operatorColor = '#0d9488';
    } else {
        // Unknown 09xx prefix
        return {
            isValid: false,
            cleanNumber: clean,
            formattedNumber: clean,
            errorMessage: `پیش‌شماره ${prefix4} در میان پیش‌شماره‌های معتبر اپراتورهای ایران تعریف نشده است.`
        };
    }

    // Formatted: 0917 123 4567
    const formattedNumber = `${clean.substring(0, 4)} ${clean.substring(4, 7)} ${clean.substring(7)}`;

    return {
        isValid: true,
        cleanNumber: clean,
        formattedNumber,
        operatorName,
        operatorColor
    };
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

// --- Iranian License Plate Constants & Validation ---

export interface IranianPlateLetterOption {
    letter: string;
    label: string;
    type: 'PRIVATE' | 'TAXI' | 'COMMERCIAL' | 'GOVERNMENT' | 'POLICE' | 'CORPS' | 'SPECIAL' | 'TRANSIT';
    bgClass?: string;
    textClass?: string;
}

export const IRANIAN_PLATE_LETTERS: IranianPlateLetterOption[] = [
    { letter: 'ب', label: 'ب (شخصی)', type: 'PRIVATE' },
    { letter: 'ج', label: 'ج (شخصی)', type: 'PRIVATE' },
    { letter: 'د', label: 'د (شخصی)', type: 'PRIVATE' },
    { letter: 'س', label: 'س (شخصی)', type: 'PRIVATE' },
    { letter: 'ص', label: 'ص (شخصی)', type: 'PRIVATE' },
    { letter: 'ط', label: 'ط (شخصی)', type: 'PRIVATE' },
    { letter: 'ق', label: 'ق (شخصی)', type: 'PRIVATE' },
    { letter: 'ل', label: 'ل (شخصی)', type: 'PRIVATE' },
    { letter: 'م', label: 'م (شخصی)', type: 'PRIVATE' },
    { letter: 'ن', label: 'ن (شخصی)', type: 'PRIVATE' },
    { letter: 'و', label: 'و (شخصی)', type: 'PRIVATE' },
    { letter: 'ه', label: 'هـ (شخصی)', type: 'PRIVATE' },
    { letter: 'ی', label: 'ی (شخصی)', type: 'PRIVATE' },
    { letter: 'ت', label: 'ت (تاکسی)', type: 'TAXI' },
    { letter: 'ع', label: 'ع (عمومی / باری / ون)', type: 'COMMERCIAL' },
    { letter: 'ک', label: 'ک (کشاورزی / ادوات)', type: 'COMMERCIAL' },
    { letter: 'الف', label: 'الف (دولتی)', type: 'GOVERNMENT' },
    { letter: 'پ', label: 'پ (پلیس)', type: 'POLICE' },
    { letter: 'ث', label: 'ث (سپاه)', type: 'CORPS' },
    { letter: 'ز', label: 'ز (وزارت دفاع)', type: 'SPECIAL' },
    { letter: 'ف', label: 'ف (ستاد کل نیروهای مسلح)', type: 'SPECIAL' },
    { letter: 'ش', label: 'ش (ارتش)', type: 'SPECIAL' },
    { letter: 'ژ', label: 'ژ (معلولین و جانبازان)', type: 'SPECIAL' },
    { letter: 'گ', label: 'گ (گذر موقت)', type: 'TRANSIT' },
    { letter: 'D', label: 'D (دیپلماتیک)', type: 'SPECIAL' },
    { letter: 'S', label: 'S (سرویس سفارت)', type: 'SPECIAL' }
];

export const IRANIAN_PLATE_PROVINCE_CODES: Record<string, string> = {
    // تهران
    '11': 'تهران (مرکزی)',
    '22': 'تهران',
    '33': 'تهران',
    '44': 'تهران',
    '55': 'تهران',
    '66': 'تهران',
    '77': 'تهران',
    '88': 'تهران',
    '99': 'تهران',
    '10': 'تهران',
    '20': 'تهران',
    '30': 'تهران',
    '40': 'تهران',
    '50': 'تهران',
    '60': 'تهران',
    '70': 'تهران',
    '80': 'تهران',
    '90': 'تهران',
    '21': 'تهران (شهریار/شهر قدس)',
    '78': 'تهران (اسلامشهر/رباط کریم)',
    // فارس (شیراز و شهرستان‌ها)
    '63': 'فارس (شیراز)',
    '73': 'فارس (جهرم/فسا/لار/کازرون)',
    '83': 'فارس (مرودشت/آباده/اقلید)',
    '93': 'فارس (فارس جنوبی/ممسنی/داراب)',
    // البرز (کرج)
    '68': 'البرز (کرج/فردیس)',
    // خراسان رضوی (مشهد)
    '12': 'خراسان رضوی (مشهد)',
    '32': 'خراسان رضوی (نیشابور/سبزوار)',
    '36': 'خراسان رضوی (تربت حیدریه/کاشمر)',
    '42': 'خراسان رضوی (تربت جام/قوچان)',
    '74': 'خراسان رضوی (چناران/گناباد)',
    // اصفهان
    '13': 'اصفهان (مرکزی)',
    '23': 'اصفهان (کاشان/نجف‌آباد)',
    '43': 'اصفهان (شهرضا/لنجان)',
    '53': 'اصفهان (فلاورجان/خمینی‌شهر)',
    '67': 'اصفهان (شاهین‌شهر)',
    // آذربایجان شرقی (تبریز)
    '15': 'آذربایجان شرقی (تبریز)',
    '25': 'آذربایجان شرقی (مراغه/مرند)',
    '35': 'آذربایجان شرقی (میانه/اهر)',
    // آذربایجان غربی (ارومیه)
    '17': 'آذربایجان غربی (ارومیه)',
    '27': 'آذربایجان غربی (خوی/مهاباد)',
    '37': 'آذربایجان غربی (میاندوآب/ماکو)',
    // خوزستان
    '14': 'خوزستان (اهواز)',
    '24': 'خوزستان (آبادان/خرمشهر/دزفول)',
    '34': 'خوزستان (ماهشهر/بهبهان)',
    // مازندران
    '62': 'مازندران (ساری)',
    '72': 'مازندران (بابل/آمل)',
    '82': 'مازندران (قائم‌شهر/تنکابن/چالوس)',
    '92': 'مازندران (نور/نوشهر/رامسر)',
    // گیلان
    '46': 'گیلان (رشت)',
    '56': 'گیلان (انزلی/لاهیجان)',
    '76': 'گیلان (تالش/لنگرود/رودسر)',
    // بوشهر
    '48': 'بوشهر (مرکزی)',
    '58': 'بوشهر (دشتستان/گناوه/کنگان)',
    // کرمان
    '45': 'کرمان (مرکزی)',
    '65': 'کرمان (سیرجان/رفسنجان/جیرفت)',
    '75': 'کرمان (بم/کهنوج)',
    // قم
    '16': 'قم',
    // کرمانشاه
    '19': 'کرمانشاه',
    '29': 'کرمانشاه (اسلام‌آباد/کنگاور)',
    // لرستان
    '31': 'لرستان (خرم‌آباد)',
    '41': 'لرستان (بروجرد/دورود)',
    // یزد
    '54': 'یزد',
    '64': 'یزد (میبد/اردکان)',
    // هرمزگان
    '84': 'هرمزگان (بندرعباس)',
    '94': 'هرمزگان (میناب/قشم/کیش)',
    // سیستان و بلوچستان
    '85': 'سیستان و بلوچستان (زاهدان)',
    '95': 'سیستان و بلوچستان (زابل/ایرانشهر/چابهار)',
    // کردستان
    '51': 'کردستان (سنندج)',
    '61': 'کردستان (سقز/بانه/مریوان)',
    // همدان
    '18': 'همدان',
    '28': 'همدان (ملایر/نهاوند)',
    // مرکزی
    '47': 'مرکزی (اراک)',
    '57': 'مرکزی (ساوه/خمین)',
    // گلستان
    '59': 'گلستان (گرگان)',
    '69': 'گلستان (گنبد کاووس)',
    // قزوین
    '79': 'قزوین',
    '89': 'قزوین (تاکستان/بویین‌زهرا)',
    // اردبیل
    '91': 'اردبیل',
    // ایلام
    '98': 'ایلام',
    // چهارمحال و بختیاری
    '71': 'چهارمحال و بختیاری (شهرکرد)',
    '81': 'چهارمحال و بختیاری',
    // کهگیلویه و بویراحمد
    '49': 'کهگیلویه و بویراحمد (یاسوج/گچساران)',
    // سمنان
    '86': 'سمنان',
    '96': 'سمنان (شاهرود/دامغان)',
    // زنجان
    '87': 'زنجان',
    '97': 'زنجان (ابهر/خرمدره)',
    // خراسان شمالی
    '26': 'خراسان شمالی (بجنورد/شیروان)',
    // خراسان جنوبی
    '52': 'خراسان جنوبی (بیرجند/قائن)'
};

/**
 * Parses an Iranian plate string into individual components
 * Supports: "12 ل 345 ایران 63", "12ل345ایران63", "۱۲ ل ۳۴۵ ایران ۶۳", partial entries, "فاقد پلاک", "پلاک صفر"
 */
export function parseIranianPlate(plateStr: string): IranianPlateParts {
    if (!plateStr) {
        return { part1: '', letter: 'ب', part2: '', iranCode: '' };
    }

    const trimmed = plateStr.trim();
    if (trimmed.includes('صفر') || trimmed.includes('فاقد') || trimmed.includes('بدون پلاک')) {
        return { part1: '', letter: 'ب', part2: '', iranCode: '', isZeroOrFree: true, freeText: trimmed };
    }

    // Convert digits to English
    const eng = toEnglishDigits(trimmed);

    // Check flexible partial/complete match: (1-2 digits) + (letter) + (1-3 digits) + (iran 1-2 digits)
    const match = eng.match(/^(\d{1,2})?\s*([^\d\s\-_]+)?\s*(\d{1,3})?\s*(?:ایران|Iran|-)?\s*(\d{1,2})?$/i);
    if (match && (match[1] || match[2] || match[3] || match[4])) {
        let letter = (match[2] || '').trim();
        if (!letter || letter === 'ایران') letter = 'ب';
        if (letter === 'الف' || letter === 'ا') letter = 'الف';
        if (letter === 'ه' || letter === 'هـ') letter = 'ه';
        return {
            part1: match[1] || '',
            letter,
            part2: match[3] || '',
            iranCode: match[4] || ''
        };
    }

    // Fallback: extract digits and letter
    const digitsOnly = eng.replace(/\D/g, '');
    const lettersOnly = eng.replace(/[\d\s\-_]/g, '').replace('ایران', '');
    const letter = lettersOnly ? lettersOnly.charAt(0) : 'ب';

    return { 
        part1: digitsOnly.slice(0, 2), 
        letter, 
        part2: digitsOnly.slice(2, 5), 
        iranCode: digitsOnly.slice(5, 7), 
        freeText: trimmed 
    };
}

/**
 * Builds standard Iranian plate string
 * Format: "۱۲ ل ۳۴۵ ایران ۶۳"
 */
export function buildIranianPlateString(parts: IranianPlateParts): string {
    if (parts.isZeroOrFree) {
        return parts.freeText || 'پلاک صفر کیلومتر (فاقد پلاک انتظامی)';
    }

    const p1 = toPersianDigits(parts.part1 ? parts.part1.trim() : '');
    const lettr = (parts.letter || 'ب').trim();
    const p2 = toPersianDigits(parts.part2 ? parts.part2.trim() : '');
    const iran = toPersianDigits(parts.iranCode ? parts.iranCode.trim() : '');

    if (!parts.part1 && !parts.part2 && !parts.iranCode) {
        return parts.freeText || '';
    }

    const elements: string[] = [];
    if (p1) elements.push(p1);
    if (lettr) elements.push(lettr);
    if (p2) elements.push(p2);
    if (iran) {
        elements.push(`ایران ${iran}`);
    }

    return elements.join(' ').trim();
}

/**
 * Validates Iranian License Plate
 */
export function validateIranianLicensePlate(plateInput: string | IranianPlateParts): PlateValidationResult {
    let parts: IranianPlateParts;
    if (typeof plateInput === 'string') {
        parts = parseIranianPlate(plateInput);
    } else {
        parts = plateInput;
    }

    if (parts.isZeroOrFree) {
        return {
            isValid: true,
            formattedPlate: parts.freeText || 'پلاک صفر کیلومتر (فاقد پلاک انتظامی)',
            plateType: 'ZERO_KM',
            provinceHint: 'خودروی صفر کیلومتر',
            parts
        };
    }

    const p1 = toEnglishDigits(parts.part1).replace(/\D/g, '');
    const p2 = toEnglishDigits(parts.part2).replace(/\D/g, '');
    const iran = toEnglishDigits(parts.iranCode).replace(/\D/g, '');
    const letter = (parts.letter || '').trim();

    if (!p1 && !p2 && !iran) {
        return {
            isValid: false,
            formattedPlate: '',
            plateType: 'NATIONAL_PRIVATE',
            errorMessage: 'شماره پلاک انتظامی وارد نشده است.'
        };
    }

    if (p1.length !== 2) {
        return {
            isValid: false,
            formattedPlate: buildIranianPlateString(parts),
            plateType: 'NATIONAL_PRIVATE',
            errorMessage: `بخش دو رقمی اول پلاک باید دقیقاً ۲ رقم باشد (وارد شده: ${p1.length} رقم)`,
            parts
        };
    }

    if (!letter) {
        return {
            isValid: false,
            formattedPlate: buildIranianPlateString(parts),
            plateType: 'NATIONAL_PRIVATE',
            errorMessage: 'حرف فارسی وسط پلاک انتخاب نشده است.',
            parts
        };
    }

    if (p2.length !== 3) {
        return {
            isValid: false,
            formattedPlate: buildIranianPlateString(parts),
            plateType: 'NATIONAL_PRIVATE',
            errorMessage: `بخش سه رقمی وسط پلاک باید دقیقاً ۳ رقم باشد (وارد شده: ${p2.length} رقم)`,
            parts
        };
    }

    if (iran.length !== 2) {
        return {
            isValid: false,
            formattedPlate: buildIranianPlateString(parts),
            plateType: 'NATIONAL_PRIVATE',
            errorMessage: `کد دو رقمی شهر/استان پلاک (کد ایران) باید دقیقاً ۲ رقم باشد (وارد شده: ${iran.length} رقم)`,
            parts
        };
    }

    const provinceHint = IRANIAN_PLATE_PROVINCE_CODES[iran] || `ایران کد ${iran}`;
    let plateType: PlateValidationResult['plateType'] = 'NATIONAL_PRIVATE';

    if (letter === 'ت') plateType = 'TAXI';
    else if (letter === 'ع' || letter === 'ک') plateType = 'NATIONAL_COMMERCIAL';
    else if (letter === 'الف') plateType = 'GOVERNMENT';
    else if (letter === 'گ') plateType = 'TEMPORARY';

    return {
        isValid: true,
        formattedPlate: `${toPersianDigits(p1)} ${letter} ${toPersianDigits(p2)} ایران ${toPersianDigits(iran)}`,
        plateType,
        provinceHint,
        parts: {
            part1: p1,
            letter,
            part2: p2,
            iranCode: iran
        }
    };
}
