export type LeasingFormId =
    | 'PRE_REGISTRATION'       // 1. فرم پیش ثبت نام
    | 'INSTALLMENT_CONTRACT'   // 2. قرارداد فروش اقساطی خودرو (۲ صفحه)
    | 'NATURAL_AFFIDAVIT'      // 3. اقرارنامه اشخاص حقیقی
    | 'LEGAL_AFFIDAVIT'        // 4. اقرارنامه اشخاص حقوقی
    | 'LEASING_PEACE_CONTRACT' // 5. صلحنامه واسپاری
    | 'PEACE_ADDENDUM'         // 6. متمم صلحنامه
    | 'CUSTOMER_FINAL_INFO'    // 7. آخرین اطلاعات مشتری (سند و پلاک)
    | 'GUARANTOR_FINAL_INFO';  // 8. آخرین اطلاعات ضامن یا صادرکننده چک

export type LeasingMaritalStatus = 'مجرد' | 'متاهل';

export interface LeasingAddressInfo {
    province: string;          // استان محل سکونت
    county: string;            // شهرستان محل سکونت
    city: string;              // شهر محل سکونت
    mainStreet: string;        // خیابان اصلی
    subStreet: string;         // خیابان فرعی
    alley: string;             // کوچه
    plaque: string;            // شماره پلاک
    floor: string;             // طبقه
    unit: string;              // واحد
    municipalityZone: string;  // منطقه شهرداری
    postalCode: string;        // کد پستی ۱۰ رقمی
    landlinePhone: string;     // شماره تلفن ثابت
    mobilePhone: string;       // شماره تلفن همراه
    fullAddressText: string;   // نشانی کامل خلاصه (تولید خودکار یا دستی برای قراردادها)
}

export interface LeasingPersonInfo {
    title: 'آقای' | 'خانم';
    firstName: string;
    lastName: string;
    fatherName: string;
    idNumber: string;          // شماره شناسنامه
    issuePlace: string;        // صادره از (شهر/حوزه)
    issueProvince: string;     // استان محل صدور
    issueCounty: string;       // شهرستان محل صدور
    birthDate: string;         // تاریخ تولد
    birthProvince: string;     // استان محل تولد
    birthCounty: string;       // شهرستان محل تولد
    idIssueDate: string;       // تاریخ صدور شناسنامه
    nationalCode: string;      // کد ملی
    maritalStatus: LeasingMaritalStatus;
    education: string;         // مدرک تحصیلی
    occupation: string;        // شغل
    address: LeasingAddressInfo;
}

export interface LeasingLegalEntity {
    isActive: boolean;         // آیا خریدار حقوقی هم دارد؟
    companyName: string;
    registrationNumber: string;
    nationalId: string;        // شناسه ملی
    registrationOffice: string;// ثبت شده در اداره ثبت شرکت‌های ...
    economicCode: string;      // شماره اقتصادی
    rep1Name: string;
    rep1Title: string;
    rep2Name: string;
    rep2Title: string;
    gazetteNumber: string;     // روزنامه رسمی شماره
    gazetteDate: string;       // مورخ
    address: string;
    postalCode: string;
    phone: string;
}

export interface LeasingCheckRow {
    id: string;
    amountRials: number;
    checkDate: string;
    checkNumber: string;
    issuerName: string;
    issuerNationalCode: string;
    bankName: string;
}

export interface LeasingPeaceParty {
    isLegal: boolean;
    firstName: string;
    lastName: string;
    fatherName: string;
    idNumber: string;
    issuePlace: string;
    birthDate: string;
    idIssueDate: string;
    nationalCode: string;
    postalCode: string;
    mobilePhone: string;
    legalName: string;
    legalRegNumber: string;
    legalAddress: string;
}

export interface LeasingCase {
    id: string;
    createdAt: string;
    updatedAt: string;

    // --- 1. اطلاعات پایه پرونده، قرارداد و نمایندگی ---
    dealershipName: string;
    dealershipCode: string;
    formDate: string;               // تاریخ عمومی فرم پیش‌ثبت‌نام و تکمیل فرم
    contractNumber: string;         // شماره قرارداد
    contractDate: string;           // تاریخ قرارداد
    registrationRequestNumber: string; // شماره فرم درخواست ثبت نام
    registrationRequestDate: string;   // تاریخ فرم درخواست ثبت نام

    // --- 2. مشخصات خودرو و تحویل ---
    carModel: string;               // نوع / مدل خودرو
    modelYear: string;              // سال ساخت (مدل)
    color: string;
    chassisNumber: string;
    engineNumber: string;
    invoiceOrBillRef: string;       // طبق فاکتور / مبایعه‌نامه
    deliveryProvince: string;       // استان محل تحویل
    deliveryCounty: string;         // شهرستان محل تحویل
    deliveryCity: string;           // شهر محل تحویل

    // --- 3. شرایط مالی و اقساط ---
    cashPriceRials: number;         // قیمت فروش نقدی / ثمن مورد معامله
    installmentTotalPriceRials: number; // قیمت فروش اقساطی با احتساب سود
    prepaymentRials: number;        // پیش پرداخت
    remainingAmountRials: number;   // الباقی ثمن معامله
    installmentsCount: number;      // تعداد قسط
    installmentIntervalMonths: number; // تناوب ماهانه (مثلا ۱ یا ۳ ماهه)
    annualProfitPercent: number;    // نرخ سود سالانه درصد
    contractDurationMonths: number; // مدت قرارداد (ماه شمسی)
    contractStartDate: string;      // از تاریخ
    contractEndDate: string;        // لغایت تاریخ
    checks: LeasingCheckRow[];      // جدول چک‌ها

    // --- 4. طرفین قرارداد: خریدار (حقیقی و حقوقی) و ضامن‌ها ---
    buyer: LeasingPersonInfo;
    legalBuyer: LeasingLegalEntity;
    guarantor1: LeasingPersonInfo;
    guarantor2: LeasingPersonInfo;
    activeGuarantorTabForFinalForm: 'guarantor1' | 'guarantor2' | 'buyer';

    // --- 5. اقرارنامه (حقیقی و حقوقی) ---
    affidavitDepositDate: string;
    affidavitAmountRials: number;
    naturalPayer: {
        fullName: string;
        fatherName: string;
        nationalCode: string;
    };
    legalPayer: {
        companyName: string;
        registrationNumber: string;
        nationalId: string;
    };

    // --- 6. صلحنامه و متمم صلحنامه واسپاری ---
    peaceNumber: string;
    peaceDate: string;
    peaceAddendumDate: string;
    peaceAddendumReferenceNo: string; // موضوع صلح حواله شماره
    mosaleh: LeasingPeaceParty;       // مصالح (انتقال‌دهنده)
    motasaleh: LeasingPeaceParty;     // متصالح (انتقال‌گیرنده)
    peaceWitness: {
        name: string;
        fatherName: string;
        address: string;
    };
}
