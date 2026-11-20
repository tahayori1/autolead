import type {
    LeasingAddressInfo,
    LeasingCase,
    LeasingCheckRow,
    LeasingFormId,
    LeasingLegalCustomerExtra,
    LeasingLegalEntity,
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
    registrationDate: '۱۳۸۴/۰۳/۱۰',
    registrationCity: 'تهران',
    postalCode: '۱۹۹۸۸۳۶۳۴۶',
    licenseIssueDate: '۱۳۹۴/۱۰/۰۹',
    website: 'www.kmc-leasing.com',
    representative: 'آقای محمد رضا ستایش (مدیر عامل و عضو هیات مدیره)',
    address: 'تهران، سعادت آباد، بین میدان کاج و شهرداری، خیابان صرافهای شمالی، خیابان نوزدهم شمالی، پلاک ۲۱، طبقه ۵',
    peaceAddress: 'تهران، سعادت آباد، بین میدان کاج و میدان قیصر امین پور، انتهای خیابان صرافهای شمالی، خیابان نوزدهم شمالی، پلاک ۲۱، طبقه ۵',
    phone: '۰۲۱-۴۴۹۹۸۲۰۴-۸',
    complaintPhone: '۰۲۱۴۴۹۹۸۲۰۴'
};

export type LeasingFormCategory = 'contract' | 'affidavit_peace' | 'identity_poa' | 'plate_mortgage';

export interface LeasingFormMeta {
    id: LeasingFormId;
    category: LeasingFormCategory;
    title: string;
    shortTitle: string;
    badge: string;
    description: string;
}

export const LEASING_FORM_CATEGORIES: { id: LeasingFormCategory; label: string }[] = [
    { id: 'contract', label: 'ثبت‌نام و قرارداد اصلی' },
    { id: 'affidavit_peace', label: 'اقرارنامه و صلح‌نامه' },
    { id: 'identity_poa', label: 'احراز هویت و وکالت' },
    { id: 'plate_mortgage', label: 'تعویض پلاک و فک رهن' }
];

export const LEASING_FORMS_LIST: LeasingFormMeta[] = [
    {
        id: 'PRE_REGISTRATION',
        category: 'contract',
        title: 'فرم پیش ثبت نام لیزینگ',
        shortTitle: '۱. پیش ثبت نام',
        badge: 'درخواست اولیه',
        description: 'ثبت درخواست خرید اقساطی، مبلغ پیش‌پرداخت، تعداد و تناوب اقساط و تایید نمایندگی'
    },
    {
        id: 'INSTALLMENT_CONTRACT',
        category: 'contract',
        title: 'قرارداد فروش اقساطی خودرو (۸ صفحه - ۲۸ ماده)',
        shortTitle: '۲. قرارداد اقساطی (۸ ص)',
        badge: '۲۸ ماده رسمی',
        description: 'متن کامل قرارداد رسمی واسپاری کرمان موتور (۸ صفحه، ۲۸ ماده و ۷ تبصره، نسخه ضامن حقیقی یا شرکتی)'
    },
    {
        id: 'ARTICLE_36_FORM',
        category: 'contract',
        title: 'فرم ماده ۳۶ دستورالعمل اجرایی',
        shortTitle: '۳. فرم ماده ۳۶',
        badge: 'دستورالعمل اجرایی',
        description: 'اقرارنامه اطلاع از مبلغ اصل و فرع تسهیلات، تابع PMT، شرایط انصراف ۱٪ و چک تعهدات ماده ۳۶'
    },
    {
        id: 'NATURAL_AFFIDAVIT',
        category: 'affidavit_peace',
        title: 'اقرارنامه اشخاص حقیقی',
        shortTitle: '۴. اقرارنامه حقیقی',
        badge: 'واریز وجه حقیقی',
        description: 'اقرارنامه واریز وجه توسط شخص حقیقی به طرفیت متقاضی ثبت‌نام'
    },
    {
        id: 'LEGAL_AFFIDAVIT',
        category: 'affidavit_peace',
        title: 'اقرارنامه اشخاص حقوقی',
        shortTitle: '۵. اقرارنامه حقوقی',
        badge: 'واریز وجه شرکتی',
        description: 'اقرارنامه واریز وجه توسط شرکت/شخص حقوقی به طرفیت متقاضی ثبت‌نام'
    },
    {
        id: 'LEASING_PEACE_CONTRACT',
        category: 'affidavit_peace',
        title: 'صلحنامه شرکت واسپاری کرمان موتور',
        shortTitle: '۶. صلحنامه واسپاری',
        badge: 'واگذاری حقوق',
        description: 'صلحنامه واگذاری امتیاز ثبت‌نام بین مصالح و متصالح با جداول کامل و تایید نمایندگی'
    },
    {
        id: 'PEACE_ADDENDUM',
        category: 'affidavit_peace',
        title: 'متمم صلحنامه',
        shortTitle: '۷. متمم صلحنامه',
        badge: 'خسارت تاخیر',
        description: 'متمم صلحنامه مبنی بر استثنای مطالبه خسارت تاخیر قراردادی'
    },
    {
        id: 'POA_PLATE_MORTGAGE',
        category: 'identity_poa',
        title: 'وکالت فک پلاک و تنظیم سند رهنی',
        shortTitle: '۸. وکالت فک پلاک و رهن',
        badge: 'وکالت رسمی',
        description: 'متن وکالت‌نامه فک پلاک و ترهین خودرو به نام شرکت واسپاری کرمان موتور'
    },
    {
        id: 'CUSTOMER_FINAL_INFO',
        category: 'identity_poa',
        title: 'آخرین اطلاعات مشتری حقیقی (سند و پلاک)',
        shortTitle: '۹. اطلاعات مشتری حقیقی',
        badge: 'احراز سکونت و پلاک',
        description: 'فرم تکمیلی مشخصات شناسنامه‌ای، محل سکونت دقیق، خودرو و محل تحویل'
    },
    {
        id: 'LEGAL_CUSTOMER_FINAL_INFO',
        category: 'identity_poa',
        title: 'آخرین اطلاعات مشتری حقوقی (سند و پلاک)',
        shortTitle: '۱۰. اطلاعات مشتری حقوقی',
        badge: 'احراز شرکتی',
        description: 'فرم مشخصات کامل شرکت، محل دفتر، کارگزار و نماینده حقیقی جهت صدور سند و پلاک'
    },
    {
        id: 'GUARANTOR_FINAL_INFO',
        category: 'identity_poa',
        title: 'آخرین اطلاعات ضامن یا صادرکننده چک',
        shortTitle: '۱۱. اطلاعات ضامن / چک',
        badge: 'احراز ضامن',
        description: 'فرم مشخصات کامل هویتی و نشانی دقیق ضامن اول، ضامن دوم یا صادرکننده چک'
    },
    {
        id: 'PLATE_CHANGE_COMMITMENT',
        category: 'plate_mortgage',
        title: 'فرم تعهد تعویض پلاک (۳۰ روزه)',
        shortTitle: '۱۲. تعهد تعویض پلاک',
        badge: 'مهلت ۳۰ روز',
        description: 'تعهد مشتری به تعویض پلاک ظرف ۳۰ روز و ارائه تصویر برگه سبز جدید'
    },
    {
        id: 'PLATE_CHANGE_ADDENDUM',
        category: 'plate_mortgage',
        title: 'الحاقیه تعهد به تعویض پلاک',
        shortTitle: '۱۳. الحاقیه تعویض پلاک',
        badge: 'چک ۱ میلیارد ریال',
        description: 'الحاقیه ۳ ماده‌ای تعهد تعویض پلاک همراه با جدول مشخصات چک ضمانت'
    },
    {
        id: 'PLATE_CHECK_RETURN_REQUEST',
        category: 'plate_mortgage',
        title: 'فرم ۱۵ درخواست عودت چک تعهد تعویض پلاک',
        shortTitle: '۱۴. فرم ۱۵ عودت چک پلاک',
        badge: 'فرم ۱۵',
        description: 'درخواست مشتری و تاییدیه‌های پشتیبانی فروش، مدیریت فروش، مدیرعامل و امور مالی'
    },
    {
        id: 'PLATE_LETTER_RECEIPT',
        category: 'plate_mortgage',
        title: 'فرم رسید دریافت نامه تعویض پلاک',
        shortTitle: '۱۵. رسید نامه تعویض پلاک',
        badge: 'رسید تحویل نامه',
        description: 'اقرار دریافت اصل نامه تعویض پلاک خودرو در نمایندگی'
    },
    {
        id: 'MORTGAGE_RELEASE_REQUEST',
        category: 'plate_mortgage',
        title: 'فرم فک رهن و استرداد اسناد ضمانت',
        shortTitle: '۱۶. فرم فک رهن',
        badge: 'تسویه نهایی',
        description: 'درخواست عودت اسناد ضمانت، استرداد چک‌های اقساط و صدور نامه فک رهن'
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

export function createEmptyLegalEntity(defaultOffice = 'شیراز'): LeasingLegalEntity {
    return {
        isActive: false,
        companyName: '',
        registrationNumber: '',
        nationalId: '',
        registrationOffice: defaultOffice,
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
    };
}

export function createEmptyLegalCustomerExtra(defaultProvince = 'فارس', defaultCity = 'شیراز'): LeasingLegalCustomerExtra {
    return {
        companyType: 'خصوصی',
        ceoName: '',
        brokerName: '',
        establishmentProvince: defaultProvince,
        establishmentCounty: defaultCity,
        establishmentCity: defaultCity,
        officeProvince: defaultProvince,
        officeCounty: defaultCity,
        officeCity: defaultCity,
        registrationDate: '',
        activityStartDate: '',
        municipalityZone: '',
        mainStreet: '',
        subStreet: '',
        mainAlley: '',
        subAlley: '',
        block: '',
        plaque: '',
        floor: '',
        unit: '',
        areaCode: '071',
        fax: '',
        repFullName: '',
        repIdNumber: '',
        repLandline: '',
        repMobile: '',
        repNationalCode: '',
        repAddress: '',
        repPostalCode: ''
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
        dealershipManagerName: '',
        formDate: today,
        contractNumber: `1405/LS-${numSuffix}`,
        contractDate: today,
        registrationRequestNumber: '',
        registrationRequestDate: today,

        vehicleQuantity: 1,
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

        guarantee120PercentRials: 0,
        guaranteeChecks: [
            { id: 'gchk-1', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
            { id: 'gchk-2', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' }
        ],
        article36FacilityTotalRials: 0,
        article36ObligationCheckRials: 0,

        buyer: createEmptyPerson('فارس', 'شیراز'),
        legalBuyer: createEmptyLegalEntity('شیراز'),
        legalCustomerExtra: createEmptyLegalCustomerExtra('فارس', 'شیراز'),
        guarantorMode: 'natural',
        guarantor1: createEmptyPerson('فارس', 'شیراز'),
        guarantor2: createEmptyPerson('فارس', 'شیراز'),
        corporateGuarantor: createEmptyLegalEntity('شیراز'),
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
        },

        plateChangeCheck: {
            amountRials: 1_000_000_000,
            checkDate: '',
            checkNumber: '',
            issuerName: '',
            issuerNationalCode: '',
            bankName: ''
        },
        plateReturnRequest: {
            letterNumber: '',
            letterDate: today,
            attachment: 'تصویر برگ سبز خودرو',
            receiptReferralDate: today
        },
        mortgageReleaseOptions: {
            guaranteeDocs: true,
            earlySettlementChecks: false,
            mortgageReleaseLetter: true,
            bouncedCheck: false,
            bankDepositChecks: false,
            presenterName: ''
        }
    };
}

export function normalizeLeasingCase(raw: Partial<LeasingCase>): LeasingCase {
    const def = createDefaultLeasingCase();
    return {
        ...def,
        ...raw,
        buyer: {
            ...def.buyer,
            ...(raw.buyer || {}),
            address: { ...def.buyer.address, ...(raw.buyer?.address || {}) }
        },
        legalBuyer: { ...def.legalBuyer, ...(raw.legalBuyer || {}) },
        legalCustomerExtra: { ...def.legalCustomerExtra, ...(raw.legalCustomerExtra || {}) },
        guarantor1: {
            ...def.guarantor1,
            ...(raw.guarantor1 || {}),
            address: { ...def.guarantor1.address, ...(raw.guarantor1?.address || {}) }
        },
        guarantor2: {
            ...def.guarantor2,
            ...(raw.guarantor2 || {}),
            address: { ...def.guarantor2.address, ...(raw.guarantor2?.address || {}) }
        },
        corporateGuarantor: { ...def.corporateGuarantor, ...(raw.corporateGuarantor || {}) },
        naturalPayer: { ...def.naturalPayer, ...(raw.naturalPayer || {}) },
        legalPayer: { ...def.legalPayer, ...(raw.legalPayer || {}) },
        mosaleh: { ...def.mosaleh, ...(raw.mosaleh || {}) },
        motasaleh: { ...def.motasaleh, ...(raw.motasaleh || {}) },
        peaceWitness: { ...def.peaceWitness, ...(raw.peaceWitness || {}) },
        plateChangeCheck: { ...def.plateChangeCheck, ...(raw.plateChangeCheck || {}) },
        plateReturnRequest: { ...def.plateReturnRequest, ...(raw.plateReturnRequest || {}) },
        mortgageReleaseOptions: { ...def.mortgageReleaseOptions, ...(raw.mortgageReleaseOptions || {}) },
        checks: Array.isArray(raw.checks) && raw.checks.length > 0 ? raw.checks : def.checks,
        guaranteeChecks: Array.isArray(raw.guaranteeChecks) && raw.guaranteeChecks.length > 0 ? raw.guaranteeChecks : def.guaranteeChecks
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
    const [y, m, d] = parts;
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
        return Array.isArray(parsed) ? parsed.map(normalizeLeasingCase) : [];
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
    const g120 = c.guarantee120PercentRials > 0 ? c.guarantee120PercentRials : Math.round(remaining * 1.2);

    switch (formId) {
        case 'PRE_REGISTRATION':
            return [
                `تاریخ: ${toPersianDigits(c.formDate)}`,
                'فرم پیش ثبت نام — شرکت واسپاری کرمان موتور',
                `- اینجانب ${c.buyer.title} ${buyerName} فرزند ${c.buyer.fatherName || '........'} به شماره ملی ${toPersianDigits(c.buyer.nationalCode) || '..........'} متقاضی خرید یک دستگاه خودرو ${c.carModel || '........'} مدل ${toPersianDigits(c.modelYear) || '....'} رنگ ${c.color || '........'} در نمایندگی ${toPersianDigits(c.dealershipCode)} می‌باشم.`,
                `- ثمن معامله: ${c.cashPriceRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials)) : '..........'} ریال | پیش پرداخت: ${c.prepaymentRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials)) : '..........'} ریال`,
                `- الباقی طی ${toPersianDigits(c.installmentsCount)} قسط با تناوب ${toPersianDigits(c.installmentIntervalMonths)} ماهه با سود ${toPersianDigits(c.annualProfitPercent)}٪.`
            ].join('\n');

        case 'INSTALLMENT_CONTRACT':
            return [
                `شماره قرارداد: ${c.contractNumber} | تاریخ قرارداد: ${toPersianDigits(c.contractDate)}`,
                'قرارداد فروش اقساطی خودرو (۲۸ ماده و ۷ تبصره) — شرکت واسپاری کرمان موتور',
                `خریدار: ${c.buyer.title} ${buyerName} (کد ملی: ${toPersianDigits(c.buyer.nationalCode)})`,
                c.guarantorMode === 'corporate'
                    ? `ضامن شرکتی: ${c.corporateGuarantor.companyName || '-'} | ضامن حقیقی: ${getPersonFullName(c.guarantor1) || '-'}`
                    : `ضامن ۱: ${getPersonFullName(c.guarantor1) || '-'} | ضامن ۲: ${getPersonFullName(c.guarantor2) || '-'}`,
                `خودرو: ${toPersianDigits(c.vehicleQuantity || 1)} دستگاه ${c.carModel} مدل ${toPersianDigits(c.modelYear)} | شاسی: ${c.chassisNumber || '-'} | موتور: ${c.engineNumber || '-'}`,
                `قیمت نقدی: ${toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials))} ریال | قیمت اقساطی: ${toPersianDigits(formatCurrencyWithCommas(c.installmentTotalPriceRials))} ریال | تضمین ۱۲۰٪: ${toPersianDigits(formatCurrencyWithCommas(g120))} ریال`
            ].join('\n');

        case 'ARTICLE_36_FORM': {
            const tot = c.article36FacilityTotalRials || remaining;
            return [
                `تاریخ تکمیل: ${toPersianDigits(c.formDate)} — فرم ماده ۳۶ دستورالعمل اجرایی لیزینگ`,
                `مبلغ اصل و فرع تسهیلات: ${toPersianDigits(formatCurrencyWithCommas(tot))} ریال | قیمت نقدی: ${toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials))} ریال | پیش دریافت: ${toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials))} ریال`,
                `نرخ سود: ${toPersianDigits(c.annualProfitPercent)}٪ | چک تعهدات ماده ۱۰: ${toPersianDigits(formatCurrencyWithCommas(c.article36ObligationCheckRials || g120))} ریال`,
                `متقاضی: ${buyerName}`
            ].join('\n');
        }

        case 'NATURAL_AFFIDAVIT': {
            const amt = c.affidavitAmountRials || c.prepaymentRials;
            return [
                'بسمه تعالی — اقرارنامه اشخاص حقیقی',
                `اینجانب ${c.naturalPayer.fullName || buyerName} فرزند ${c.naturalPayer.fatherName || c.buyer.fatherName || '........'} به کد ملی ${toPersianDigits(c.naturalPayer.nationalCode || c.buyer.nationalCode) || '..........'} اقرار می‌نمایم در تاریخ ${toPersianDigits(c.affidavitDepositDate)} مبلغ ${toPersianDigits(formatCurrencyWithCommas(amt))} ریال (${amt > 0 ? numberToPersianWords(amt) : '........'} ریال) را جهت خودرو ${c.carModel} شاسی ${c.chassisNumber || '........'} به طرفیت ${buyerName} واریز نموده‌ام.`
            ].join('\n');
        }

        case 'LEGAL_AFFIDAVIT': {
            const amt = c.affidavitAmountRials || c.prepaymentRials;
            const coName = c.legalPayer.companyName || c.legalBuyer.companyName || '........';
            return [
                'بسمه تعالی — اقرارنامه اشخاص حقوقی',
                `شرکت ${coName} به شماره ثبت ${toPersianDigits(c.legalPayer.registrationNumber || c.legalBuyer.registrationNumber)} و شناسه ملی ${toPersianDigits(c.legalPayer.nationalId || c.legalBuyer.nationalId)} اقرار می‌نماید مبلغ ${toPersianDigits(formatCurrencyWithCommas(amt))} ریال را جهت خودرو ${c.carModel} به طرفیت ${buyerName} واریز نموده است.`
            ].join('\n');
        }

        case 'LEASING_PEACE_CONTRACT': {
            const mosName = c.mosaleh.isLegal ? c.mosaleh.legalName : `${c.mosaleh.firstName} ${c.mosaleh.lastName}`.trim();
            const motName = c.motasaleh.isLegal ? c.motasaleh.legalName : `${c.motasaleh.firstName} ${c.motasaleh.lastName}`.trim();
            return [
                `صلحنامه واسپاری کرمان موتور — شماره: ${c.peaceNumber} | تاریخ: ${toPersianDigits(c.peaceDate)}`,
                `مصالح: ${mosName || '-'} | متصالح: ${motName || buyerName}`,
                `موضوع: خودرو ${c.carModel} | فرم درخواست ثبت نام: ${c.registrationRequestNumber || '-'} مورخ ${toPersianDigits(c.registrationRequestDate)} | کد نمایندگی: ${toPersianDigits(c.dealershipCode)}`
            ].join('\n');
        }

        case 'PEACE_ADDENDUM': {
            const motName = c.motasaleh.isLegal ? c.motasaleh.legalName : (`${c.motasaleh.firstName} ${c.motasaleh.lastName}`.trim() || buyerName);
            return [
                `متمم صلحنامه مورخه ${toPersianDigits(c.peaceAddendumDate)}`,
                `موضوع صلح حواله شماره ${c.peaceAddendumReferenceNo || c.registrationRequestNumber || '........'} | قرارداد شماره ${c.contractNumber}`,
                `انتقال حقوق قرارداد به ${motName} به استثناء موضوع مطالبه خسارت تاخیر قراردادی.`
            ].join('\n');
        }

        case 'POA_PLATE_MORTGAGE':
            return [
                'وکالت فک پلاک و تنظیم سند رهنی',
                `موکل: ${buyerName} | وکیل: شرکت واسپاری کرمان موتور (ثبت ۲۴۷۵۸۷)`,
                `موضوع: قرارداد شماره ${c.contractNumber} مورخ ${toPersianDigits(c.contractDate)} | خودرو ${c.carModel} | موتور: ${c.engineNumber || '-'} | شاسی: ${c.chassisNumber || '-'}`
            ].join('\n');

        case 'CUSTOMER_FINAL_INFO':
            return [
                'آخرین اطلاعات مشتری حقیقی جهت صدور سند و پلاک خودرو',
                `نام: ${buyerName} | فرزند: ${c.buyer.fatherName} | کد ملی: ${toPersianDigits(c.buyer.nationalCode)}`,
                `نشانی: ${buildFullAddressLine(c.buyer.address)} | کد پستی: ${toPersianDigits(c.buyer.address.postalCode)} | همراه: ${toPersianDigits(c.buyer.address.mobilePhone)}`,
                `خودرو: ${c.carModel} رنگ ${c.color} | تحویل: ${c.deliveryProvince} - ${c.deliveryCity}`
            ].join('\n');

        case 'LEGAL_CUSTOMER_FINAL_INFO':
            return [
                'آخرین اطلاعات مشتری حقوقی جهت صدور سند و پلاک خودرو',
                `شرکت: ${c.legalBuyer.companyName || '-'} | شناسه ملی: ${toPersianDigits(c.legalBuyer.nationalId)} | ثبت: ${toPersianDigits(c.legalBuyer.registrationNumber)}`,
                `نماینده: ${c.legalCustomerExtra.repFullName || c.legalBuyer.rep1Name || '-'} | خودرو: ${c.carModel} رنگ ${c.color}`
            ].join('\n');

        case 'GUARANTOR_FINAL_INFO': {
            const target = c.activeGuarantorTabForFinalForm === 'guarantor2'
                ? c.guarantor2
                : c.activeGuarantorTabForFinalForm === 'buyer'
                ? c.buyer
                : c.guarantor1;
            return [
                'آخرین اطلاعات ضامن یا صادرکننده چک',
                `نام: ${getPersonFullName(target) || '-'} | فرزند: ${target.fatherName || '-'} | کد ملی: ${toPersianDigits(target.nationalCode) || '-'}`,
                `نشانی: ${buildFullAddressLine(target.address)} | کد پستی: ${toPersianDigits(target.address.postalCode)} | همراه: ${toPersianDigits(target.address.mobilePhone)}`
            ].join('\n');
        }

        case 'PLATE_CHANGE_COMMITMENT':
            return [
                `فرم تعهد تعویض پلاک — تاریخ: ${toPersianDigits(c.formDate)}`,
                `اینجانب ${buyerName} به کد ملی ${toPersianDigits(c.buyer.nationalCode)} خریدار خودرو ${c.carModel} شاسی ${c.chassisNumber || '-'} متعهد می‌گردم حداکثر طی ۳۰ روز نسبت به تعویض پلاک اقدام نمایم.`
            ].join('\n');

        case 'PLATE_CHANGE_ADDENDUM':
            return [
                'الحاقیه تعهد به تعویض پلاک (مواد ۱ تا ۳)',
                `خریدار: ${c.legalBuyer.isActive && c.legalBuyer.companyName ? c.legalBuyer.companyName : buyerName} | مهلت: ۳۰ روز کاری`,
                `چک حسن انجام تعهد: ${toPersianDigits(formatCurrencyWithCommas(c.plateChangeCheck.amountRials))} ریال | شماره چک: ${c.plateChangeCheck.checkNumber || '-'} | بانک: ${c.plateChangeCheck.bankName || '-'}`
            ].join('\n');

        case 'PLATE_CHECK_RETURN_REQUEST':
            return [
                `فرم ۱۵ درخواست عودت چک تعهد تعویض پلاک — شماره: ${c.plateReturnRequest.letterNumber || '-'} | تاریخ: ${toPersianDigits(c.plateReturnRequest.letterDate)}`,
                `متقاضی: ${buyerName} (${toPersianDigits(c.buyer.nationalCode)}) | خودرو: ${c.carModel} | شاسی: ${c.chassisNumber || '-'} | شماره چک: ${c.plateChangeCheck.checkNumber || '-'}`
            ].join('\n');

        case 'PLATE_LETTER_RECEIPT':
            return [
                `فرم رسید دریافت نامه تعویض پلاک — تاریخ: ${toPersianDigits(c.formDate)}`,
                `اینجانب ${buyerName} (${toPersianDigits(c.buyer.nationalCode)}) خریدار خودرو ${c.carModel} شاسی ${c.chassisNumber || '-'} در تاریخ ${toPersianDigits(c.plateReturnRequest.receiptReferralDate)} اصل نامه تعویض پلاک را دریافت نمودم.`
            ].join('\n');

        case 'MORTGAGE_RELEASE_REQUEST':
            return [
                'فرم درخواست فک رهن و استرداد اسناد — شرکت واسپاری کرمان موتور',
                `متقاضی: ${buyerName} (${toPersianDigits(c.buyer.nationalCode)}) | خودرو: ${c.carModel} | شاسی: ${c.chassisNumber || '-'} | نمایندگی ${toPersianDigits(c.dealershipCode)}`
            ].join('\n');
    }
}
