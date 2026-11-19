import type {
    LeasingAddressInfo,
    LeasingCase,
    LeasingCheckRow,
    LeasingFormId,
    LeasingPeaceParty,
    LeasingPersonInfo
} from '../types/leasing';
import { getCurrentPersianDate } from './bankLetterService';
import {
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from './bankLetterValidation';

const LEASING_CASES_STORAGE_KEY = 'autolead_leasing_cases_v1';

export const LEASING_COMPANY_INFO = {
    name: 'شرکت واسپاری کرمان موتور (سهامی خاص)',
    registrationNumber: '۲۴۷۵۸۷',
    nationalId: '۱۰۱۰۲۸۸۲۰۳۰',
    economicCode: '۴۱۱۱۱۵۳۳۹۷۷۸',
    representative: 'آقای محمد رضا ستایش (مدیر عامل و عضو هیات مدیره)',
    address: 'تهران، سعادت آباد، بین میدان کاج و شهرداری، خیابان صرافهای شمالی، خیابان نوزدهم شمالی، پلاک ۲۱، طبقه ۵',
    peaceAddress: 'تهران، سعادت آباد، بین میدان کاج و میدان قیصر امین پور، انتهای خیابان صرافهای شمالی، خیابان نوزدهم شمالی، پلاک ۲۱، طبقه ۵',
    phone: '۰۲۱-۴۴۹۹۸۲۰۴-۸'
};

export interface LeasingFormMeta {
    id: LeasingFormId;
    title: string;
    shortTitle: string;
    badge: string;
    description: string;
}

export const LEASING_FORMS_LIST: LeasingFormMeta[] = [
    {
        id: 'PRE_REGISTRATION',
        title: 'فرم پیش ثبت نام لیزینگ',
        shortTitle: '۱. پیش ثبت نام',
        badge: 'درخواست اولیه',
        description: 'ثبت درخواست خرید اقساطی، مبلغ پیش‌پرداخت، تعداد و تناوب اقساط و تایید نمایندگی'
    },
    {
        id: 'INSTALLMENT_CONTRACT',
        title: 'قرارداد فروش اقساطی خودرو (۲ صفحه)',
        shortTitle: '۲. قرارداد اقساطی',
        badge: '۲ صفحه‌ای رسمی',
        description: 'قرارداد جامع فروش اقساطی واسپاری کرمان موتور شامل مشخصات خریدار، ضامن‌ها و جدول چک‌ها'
    },
    {
        id: 'NATURAL_AFFIDAVIT',
        title: 'اقرارنامه اشخاص حقیقی',
        shortTitle: '۳. اقرارنامه حقیقی',
        badge: 'واریز وجه حقیقی',
        description: 'اقرارنامه واریز وجه توسط شخص حقیقی به طرفیت متقاضی ثبت‌نام'
    },
    {
        id: 'LEGAL_AFFIDAVIT',
        title: 'اقرارنامه اشخاص حقوقی',
        shortTitle: '۴. اقرارنامه حقوقی',
        badge: 'واریز وجه شرکتی',
        description: 'اقرارنامه واریز وجه توسط شرکت/شخص حقوقی به طرفیت متقاضی ثبت‌نام'
    },
    {
        id: 'LEASING_PEACE_CONTRACT',
        title: 'صلحنامه شرکت واسپاری کرمان موتور',
        shortTitle: '۵. صلحنامه واسپاری',
        badge: 'واگذاری حقوق',
        description: 'صلحنامه واگذاری امتیاز ثبت‌نام بین مصالح و متصالح با تایید نمایندگی و شهود'
    },
    {
        id: 'PEACE_ADDENDUM',
        title: 'متمم صلحنامه',
        shortTitle: '۶. متمم صلحنامه',
        badge: 'الحاقیه خسارت تاخیر',
        description: 'متمم صلحنامه مبنی بر استثنای مطالبه خسارت تاخیر قراردادی'
    },
    {
        id: 'CUSTOMER_FINAL_INFO',
        title: 'آخرین اطلاعات مشتری (سند و پلاک)',
        shortTitle: '۷. اطلاعات نهایی مشتری',
        badge: 'احراز سکونت و پلاک',
        description: 'فرم تکمیلی مشخصات شناسنامه‌ای، محل سکونت دقیق، خودرو و محل تحویل برای صدور سند و پلاک'
    },
    {
        id: 'GUARANTOR_FINAL_INFO',
        title: 'آخرین اطلاعات ضامن یا صادرکننده چک',
        shortTitle: '۸. اطلاعات ضامن / چک',
        badge: 'احراز ضامن',
        description: 'فرم مشخصات کامل هویتی و نشانی دقیق ضامن اول، ضامن دوم یا صادرکننده چک'
    }
];

export function createEmptyAddress(defaultProvince = 'فارس', defaultCity = 'شیراز'): LeasingAddressInfo {
    return {
        province: defaultProvince,
        county: defaultCity,
        city: defaultCity,
        mainStreet: '',
        subStreet: '',
        alley: '',
        plaque: '',
        floor: '',
        unit: '',
        municipalityZone: '',
        postalCode: '',
        landlinePhone: '',
        mobilePhone: '',
        fullAddressText: ''
    };
}

export function createEmptyPerson(defaultProvince = 'فارس', defaultCity = 'شیراز'): LeasingPersonInfo {
    return {
        title: 'آقای',
        firstName: '',
        lastName: '',
        fatherName: '',
        idNumber: '',
        issuePlace: defaultCity,
        issueProvince: defaultProvince,
        issueCounty: defaultCity,
        birthDate: '',
        birthProvince: defaultProvince,
        birthCounty: defaultCity,
        idIssueDate: '',
        nationalCode: '',
        maritalStatus: 'متاهل',
        education: '',
        occupation: '',
        address: createEmptyAddress(defaultProvince, defaultCity)
    };
}

export function createEmptyPeaceParty(isLegal = false): LeasingPeaceParty {
    return {
        isLegal,
        firstName: '',
        lastName: '',
        fatherName: '',
        idNumber: '',
        issuePlace: '',
        birthDate: '',
        idIssueDate: '',
        nationalCode: '',
        postalCode: '',
        mobilePhone: '',
        legalName: isLegal ? 'شرکت واسپاری کرمان موتور' : '',
        legalRegNumber: isLegal ? '۲۴۷۵۸۷' : '',
        legalAddress: isLegal ? LEASING_COMPANY_INFO.peaceAddress : ''
    };
}

export function getPersonFullName(p: Pick<LeasingPersonInfo, 'firstName' | 'lastName'>): string {
    return [p.firstName?.trim(), p.lastName?.trim()].filter(Boolean).join(' ');
}

export function buildFullAddressLine(addr: LeasingAddressInfo): string {
    if (addr.fullAddressText?.trim()) return addr.fullAddressText.trim();
    const parts: string[] = [];
    if (addr.province) parts.push(`استان ${addr.province}`);
    if (addr.county && addr.county !== addr.city) parts.push(`شهرستان ${addr.county}`);
    if (addr.city) parts.push(`شهر ${addr.city}`);
    if (addr.mainStreet) parts.push(`خیابان ${addr.mainStreet}`);
    if (addr.subStreet) parts.push(`فرعی ${addr.subStreet}`);
    if (addr.alley) parts.push(`کوچه ${addr.alley}`);
    if (addr.plaque) parts.push(`پلاک ${addr.plaque}`);
    if (addr.floor) parts.push(`طبقه ${addr.floor}`);
    if (addr.unit) parts.push(`واحد ${addr.unit}`);
    if (addr.municipalityZone) parts.push(`منطقه ${addr.municipalityZone}`);
    return parts.join('، ');
}

export function personToPeaceParty(p: LeasingPersonInfo): LeasingPeaceParty {
    return {
        isLegal: false,
        firstName: p.firstName,
        lastName: p.lastName,
        fatherName: p.fatherName,
        idNumber: p.idNumber,
        issuePlace: p.issuePlace || p.issueCounty || p.issueProvince,
        birthDate: p.birthDate,
        idIssueDate: p.idIssueDate,
        nationalCode: p.nationalCode,
        postalCode: p.address.postalCode,
        mobilePhone: p.address.mobilePhone,
        legalName: '',
        legalRegNumber: '',
        legalAddress: ''
    };
}

export function createDefaultLeasingCase(): LeasingCase {
    const today = getCurrentPersianDate();
    const numSuffix = Math.floor(1000 + Math.random() * 9000);
    return {
        id: `ls-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        dealershipName: 'نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو شیراز)',
        dealershipCode: '2606',
        formDate: today,
        contractNumber: `1405/LS-${numSuffix}`,
        contractDate: today,
        registrationRequestNumber: '',
        registrationRequestDate: today,

        carModel: 'KMC J7',
        modelYear: '1405',
        color: 'سفید',
        chassisNumber: '',
        engineNumber: '',
        invoiceOrBillRef: '',
        deliveryProvince: 'فارس',
        deliveryCounty: 'شیراز',
        deliveryCity: 'شیراز',

        cashPriceRials: 0,
        installmentTotalPriceRials: 0,
        prepaymentRials: 0,
        remainingAmountRials: 0,
        installmentsCount: 12,
        installmentIntervalMonths: 3,
        annualProfitPercent: 23,
        contractDurationMonths: 36,
        contractStartDate: today,
        contractEndDate: '',
        checks: [
            { id: 'chk-1', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
            { id: 'chk-2', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
            { id: 'chk-3', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
            { id: 'chk-4', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' }
        ],

        buyer: createEmptyPerson('فارس', 'شیراز'),
        legalBuyer: {
            isActive: false,
            companyName: '',
            registrationNumber: '',
            nationalId: '',
            registrationOffice: 'شیراز',
            economicCode: '',
            rep1Name: '',
            rep1Title: 'مدیرعامل',
            rep2Name: '',
            rep2Title: 'رئیس هیئت مدیره',
            gazetteNumber: '',
            gazetteDate: '',
            address: '',
            postalCode: '',
            phone: ''
        },
        guarantor1: createEmptyPerson('فارس', 'شیراز'),
        guarantor2: createEmptyPerson('فارس', 'شیراز'),
        activeGuarantorTabForFinalForm: 'guarantor1',

        affidavitDepositDate: today,
        affidavitAmountRials: 0,
        naturalPayer: {
            fullName: '',
            fatherName: '',
            nationalCode: ''
        },
        legalPayer: {
            companyName: '',
            registrationNumber: '',
            nationalId: ''
        },

        peaceNumber: `1405/LPC-${numSuffix}`,
        peaceDate: today,
        peaceAddendumDate: today,
        peaceAddendumReferenceNo: '',
        mosaleh: createEmptyPeaceParty(false),
        motasaleh: createEmptyPeaceParty(false),
        peaceWitness: {
            name: '',
            fatherName: '',
            address: ''
        }
    };
}

/**
 * Adds months to a Jalali YYYY/MM/DD string safely.
 */
export function addMonthsToPersianDate(jalaliDate: string, monthsToAdd: number): string {
    const clean = jalaliDate
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .trim();
    const parts = clean.split(/[/-]/).map((n) => parseInt(n, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return '';
    let [y, m, d] = parts;
    const totalMonths = (y * 12) + (m - 1) + monthsToAdd;
    const nextY = Math.floor(totalMonths / 12);
    const nextM = (totalMonths % 12) + 1;
    const maxDay = nextM <= 6 ? 31 : (nextM <= 11 ? 30 : 29);
    const nextD = Math.min(d, maxDay);
    return `${nextY}/${String(nextM).padStart(2, '0')}/${String(nextD).padStart(2, '0')}`;
}

export function buildAutoCheckSchedule(
    leasingCase: LeasingCase,
    issuerType: 'buyer' | 'guarantor1' | 'guarantor2',
    bankName = ''
): LeasingCheckRow[] {
    const count = Math.max(1, Math.min(48, leasingCase.installmentsCount || 4));
    const interval = Math.max(1, leasingCase.installmentIntervalMonths || 1);
    const remaining = leasingCase.remainingAmountRials > 0
        ? leasingCase.remainingAmountRials
        : Math.max(0, (leasingCase.installmentTotalPriceRials || leasingCase.cashPriceRials) - leasingCase.prepaymentRials);

    const perCheck = count > 0 && remaining > 0 ? Math.round(remaining / count) : 0;
    const issuerPerson = issuerType === 'guarantor1'
        ? leasingCase.guarantor1
        : issuerType === 'guarantor2'
        ? leasingCase.guarantor2
        : leasingCase.buyer;
    const issuerName = getPersonFullName(issuerPerson);
    const issuerNationalCode = issuerPerson.nationalCode || '';
    const startDate = leasingCase.contractStartDate || leasingCase.contractDate || getCurrentPersianDate();

    return Array.from({ length: count }, (_, idx) => {
        const existing = leasingCase.checks[idx];
        return {
            id: existing?.id || `chk-${Date.now()}-${idx + 1}`,
            amountRials: perCheck || existing?.amountRials || 0,
            checkDate: addMonthsToPersianDate(startDate, (idx + 1) * interval) || existing?.checkDate || '',
            checkNumber: existing?.checkNumber || '',
            issuerName: issuerName || existing?.issuerName || '',
            issuerNationalCode: issuerNationalCode || existing?.issuerNationalCode || '',
            bankName: bankName || existing?.bankName || ''
        };
    });
}

// ============================================================================
// Archive CRUD (localStorage)
// ============================================================================

export function getSavedLeasingCases(): LeasingCase[] {
    try {
        const raw = localStorage.getItem(LEASING_CASES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveOrUpdateLeasingCase(item: LeasingCase): LeasingCase[] {
    const existing = getSavedLeasingCases();
    const updatedItem: LeasingCase = { ...item, updatedAt: new Date().toISOString() };
    const idx = existing.findIndex((c) => c.id === item.id);
    const next = idx >= 0
        ? existing.map((c, i) => (i === idx ? updatedItem : c))
        : [updatedItem, ...existing];
    localStorage.setItem(LEASING_CASES_STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function deleteLeasingCase(id: string): LeasingCase[] {
    const next = getSavedLeasingCases().filter((c) => c.id !== id);
    localStorage.setItem(LEASING_CASES_STORAGE_KEY, JSON.stringify(next));
    return next;
}

// ============================================================================
// Plain-Text Copy Formatter (for WhatsApp / Clipboard)
// ============================================================================

export function formatLeasingFormText(c: LeasingCase, formId: LeasingFormId): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const remaining = c.remainingAmountRials > 0
        ? c.remainingAmountRials
        : Math.max(0, (c.installmentTotalPriceRials || c.cashPriceRials) - c.prepaymentRials);

    switch (formId) {
        case 'PRE_REGISTRATION':
            return [
                `تاریخ: ${toPersianDigits(c.formDate)}`,
                'فرم پیش ثبت نام',
                'به نام خدا',
                'مدیریت محترم شرکت واسپاری کرمان موتور',
                'مشخصات خریدار',
                `- اینجانب ${c.buyer.title} ${buyerName} فرزند ${c.buyer.fatherName || '........'} به شماره ملی ${toPersianDigits(c.buyer.nationalCode) || '..........'} با مدارک شناسایی پیوست، متقاضی خرید یک دستگاه خودرو ${c.carModel || '........'} مدل ${toPersianDigits(c.modelYear) || '....'} رنگ ${c.color || '........'} در نمایندگی ${toPersianDigits(c.dealershipCode)} می‌باشم.`,
                'نحوه واریز پیش پرداخت',
                `- ثمن مورد معامله به مبلغ ${c.cashPriceRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials)) : '..........'} ریال مورد تائید اینجانب می‌باشد.`,
                `- متعهد می‌گردم همزمان با این درخواست، مبلغ ${c.prepaymentRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials)) : '..........'} ریال به عنوان پیش پرداخت به حساب شرکت واسپاری کرمان موتور واریز نمایم.`,
                `- الباقی ثمن معامله طی ${toPersianDigits(c.installmentsCount)} قسط با تناوب ${toPersianDigits(c.installmentIntervalMonths)} ماهه با سود ${toPersianDigits(c.annualProfitPercent)} درصد پرداخت می‌گردد.`,
                'شرایط انصراف',
                '- چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت واسپاری کرمان موتور مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت یکماه به اینجانب اعاده نماید.',
                `- صحت امضاء ${c.buyer.title} ${buyerName} بر روی فرم پیش ثبت نام مورد تأیید نمایندگی شماره ${toPersianDigits(c.dealershipCode)} کرمان موتور می‌باشد.`
            ].join('\n');

        case 'INSTALLMENT_CONTRACT':
            return [
                `شماره قرارداد: ${c.contractNumber} | تاریخ قرارداد: ${toPersianDigits(c.contractDate)}`,
                'قرارداد فروش اقساطی خودرو — شرکت واسپاری کرمان موتور',
                `خریدار: ${c.buyer.title} ${buyerName} (کد ملی: ${toPersianDigits(c.buyer.nationalCode)})`,
                `ضامن ۱: ${getPersonFullName(c.guarantor1) || '-'} | ضامن ۲: ${getPersonFullName(c.guarantor2) || '-'}`,
                `خودرو: ${c.carModel} مدل ${toPersianDigits(c.modelYear)} | شاسی: ${c.chassisNumber || '-'} | موتور: ${c.engineNumber || '-'}`,
                `قیمت نقدی: ${toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials))} ریال | قیمت اقساطی: ${toPersianDigits(formatCurrencyWithCommas(c.installmentTotalPriceRials))} ریال`,
                `پیش پرداخت: ${toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials))} ریال | الباقی: ${toPersianDigits(formatCurrencyWithCommas(remaining))} ریال طی ${toPersianDigits(c.installmentsCount)} قسط (${toPersianDigits(c.installmentIntervalMonths)} ماهه) با سود ${toPersianDigits(c.annualProfitPercent)}٪`
            ].join('\n');

        case 'NATURAL_AFFIDAVIT': {
            const amt = c.affidavitAmountRials || c.prepaymentRials;
            return [
                'بسمه تعالی — اقرارنامه اشخاص حقیقی',
                `اینجانب ${c.naturalPayer.fullName || buyerName} فرزند ${c.naturalPayer.fatherName || c.buyer.fatherName || '........'} به کد ملی ${toPersianDigits(c.naturalPayer.nationalCode || c.buyer.nationalCode) || '..........'} به موجب این سند اقرار می‌نمایم که در تاریخ ${toPersianDigits(c.affidavitDepositDate)} مبلغ به عدد ${toPersianDigits(formatCurrencyWithCommas(amt))} ریال و مبلغ به حروف ${amt > 0 ? numberToPersianWords(amt) : '........'} ریال را به شرکت واسپاری کرمان موتور جهت ثبت نام یکدستگاه خودرو ${c.carModel} به شماره شاسی ${c.chassisNumber || '........'} و شماره موتور ${c.engineNumber || '........'} مدل ${toPersianDigits(c.modelYear)} به رنگ ${c.color} با شماره قرارداد ${c.contractNumber} به طرفیت ${c.buyer.title} ${buyerName} فرزند ${c.buyer.fatherName || '........'} به کد ملی ${toPersianDigits(c.buyer.nationalCode)} واریز نموده‌ام و هیچ گونه اعتراض و ادعایی به مبلغ واریزی فوق‌الذکر ندارم.`
            ].join('\n');
        }

        case 'LEGAL_AFFIDAVIT': {
            const amt = c.affidavitAmountRials || c.prepaymentRials;
            const coName = c.legalPayer.companyName || c.legalBuyer.companyName || '........';
            const coReg = c.legalPayer.registrationNumber || c.legalBuyer.registrationNumber || '........';
            const coNid = c.legalPayer.nationalId || c.legalBuyer.nationalId || '........';
            return [
                'بسمه تعالی — اقرارنامه اشخاص حقوقی',
                `شرکت ${coName} به شماره ثبت ${toPersianDigits(coReg)} و شناسه ملی ${toPersianDigits(coNid)} به موجب این سند اقرار می‌نماید که در تاریخ ${toPersianDigits(c.affidavitDepositDate)} مبلغ به عدد ${toPersianDigits(formatCurrencyWithCommas(amt))} ریال و مبلغ به حروف ${amt > 0 ? numberToPersianWords(amt) : '........'} ریال را به شرکت واسپاری کرمان موتور جهت ثبت نام یکدستگاه خودرو ${c.carModel} به شماره شاسی ${c.chassisNumber || '........'} و شماره موتور ${c.engineNumber || '........'} مدل ${toPersianDigits(c.modelYear)} به رنگ ${c.color} با شماره قرارداد ${c.contractNumber} به طرفیت ${c.buyer.title} ${buyerName} فرزند ${c.buyer.fatherName || '........'} به کد ملی ${toPersianDigits(c.buyer.nationalCode)} واریز نموده است و هیچ گونه اعتراض و ادعایی به مبلغ واریزی فوق‌الذکر ندارد.`
            ].join('\n');
        }

        case 'LEASING_PEACE_CONTRACT': {
            const mosName = c.mosaleh.isLegal ? c.mosaleh.legalName : `${c.mosaleh.firstName} ${c.mosaleh.lastName}`.trim();
            const motName = c.motasaleh.isLegal ? c.motasaleh.legalName : `${c.motasaleh.firstName} ${c.motasaleh.lastName}`.trim();
            return [
                `صلحنامه واسپاری کرمان موتور — شماره: ${c.peaceNumber} | تاریخ: ${toPersianDigits(c.peaceDate)}`,
                `مصالح (انتقال دهنده): ${mosName || '-'} | کد ملی: ${toPersianDigits(c.mosaleh.nationalCode) || '-'}`,
                `متصالح (انتقال گیرنده): ${motName || buyerName} | کد ملی: ${toPersianDigits(c.motasaleh.nationalCode || c.buyer.nationalCode) || '-'}`,
                `موضوع: فرم درخواست ثبت نام شماره ${c.registrationRequestNumber || '-'} مورخ ${toPersianDigits(c.registrationRequestDate)} | خودرو: ${c.carModel} | کد نمایندگی: ${toPersianDigits(c.dealershipCode)}`
            ].join('\n');
        }

        case 'PEACE_ADDENDUM': {
            const motName = c.motasaleh.isLegal ? c.motasaleh.legalName : (`${c.motasaleh.firstName} ${c.motasaleh.lastName}`.trim() || buyerName);
            return [
                `متمم صلحنامه مورخه ${toPersianDigits(c.peaceAddendumDate)}`,
                `موضوع صلح حواله شماره ${c.peaceAddendumReferenceNo || c.registrationRequestNumber || '........'}`,
                `عطف به صلحنامه موصوف، نظر به صلح کلیه حقوق عینیه و متصوره از قرارداد شماره ${c.contractNumber || '........'} انتقالی به ${motName} به عنوان متصالح، حسب این متمم کلیه حقوق متصوره از قرارداد شماره ${c.contractNumber || '........'} از سوی مصالح به متصالح منتقل می‌گردد، به استثناء موضوع مطالبه خسارت تاخیر قراردادی که از موارد انتقال موضوع این صلحنامه خارج است و در این باره حقی برای متصالح متصور نمی‌باشد.`
            ].join('\n');
        }

        case 'CUSTOMER_FINAL_INFO':
            return [
                'آخرین اطلاعات مشتری در زمان خرید / تکمیل وجه جهت صدور سند و پلاک خودرو',
                `نام و نام خانوادگی: ${buyerName} | فرزند: ${c.buyer.fatherName} | کد ملی: ${toPersianDigits(c.buyer.nationalCode)}`,
                `نشانی: ${buildFullAddressLine(c.buyer.address)} | کد پستی: ${toPersianDigits(c.buyer.address.postalCode)} | همراه: ${toPersianDigits(c.buyer.address.mobilePhone)}`,
                `خودرو: ${c.carModel} رنگ ${c.color} | محل تحویل: ${c.deliveryProvince} - ${c.deliveryCity}`
            ].join('\n');

        case 'GUARANTOR_FINAL_INFO': {
            const target = c.activeGuarantorTabForFinalForm === 'guarantor2'
                ? c.guarantor2
                : c.activeGuarantorTabForFinalForm === 'buyer'
                ? c.buyer
                : c.guarantor1;
            return [
                'آخرین اطلاعات ضامن یا صادرکننده چک',
                `نام و نام خانوادگی: ${getPersonFullName(target) || '-'} | فرزند: ${target.fatherName || '-'} | کد ملی: ${toPersianDigits(target.nationalCode) || '-'}`,
                `نشانی: ${buildFullAddressLine(target.address)} | کد پستی: ${toPersianDigits(target.address.postalCode)} | همراه: ${toPersianDigits(target.address.mobilePhone)}`
            ].join('\n');
        }
    }
}
