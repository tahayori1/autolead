export type LeasingFormId =
    | 'PRE_REGISTRATION'          // 1. فرم پیش ثبت نام
    | 'INSTALLMENT_CONTRACT'      // 2. قرارداد فروش اقساطی خودرو (۸ صفحه کامل - ۲۸ ماده)
    | 'ARTICLE_36_FORM'           // 3. فرم ماده ۳۶ دستورالعمل اجرایی
    | 'NATURAL_AFFIDAVIT'         // 4. اقرارنامه اشخاص حقیقی
    | 'LEGAL_AFFIDAVIT'           // 5. اقرارنامه اشخاص حقوقی
    | 'LEASING_PEACE_CONTRACT'    // 6. صلحنامه واسپاری
    | 'PEACE_ADDENDUM'            // 7. متمم صلحنامه
    | 'POA_PLATE_MORTGAGE'        // 8. وکالت فک پلاک و تنظیم سند رهنی
    | 'CUSTOMER_FINAL_INFO'       // 9. آخرین اطلاعات مشتری حقیقی (سند و پلاک)
    | 'LEGAL_CUSTOMER_FINAL_INFO' // 10. آخرین اطلاعات مشتری حقوقی (سند و پلاک)
    | 'GUARANTOR_FINAL_INFO'      // 11. آخرین اطلاعات ضامن یا صادرکننده چک
    | 'PLATE_CHANGE_COMMITMENT'   // 12. فرم تعهد تعویض پلاک
    | 'PLATE_CHANGE_ADDENDUM'     // 13. الحاقیه تعهد به تعویض پلاک
    | 'PLATE_CHECK_RETURN_REQUEST'// 14. فرم ۱۵ درخواست عودت چک تعهد به تعویض پلاک
    | 'PLATE_LETTER_RECEIPT'      // 15. فرم رسید دریافت نامه تعویض پلاک
    | 'MORTGAGE_RELEASE_REQUEST'; // 16. فرم فک رهن و استرداد اسناد

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

export interface LeasingLegalCustomerExtra {
    companyType: 'خصوصی' | 'دولتی';
    ceoName: string;
    brokerName: string;
    establishmentProvince: string;
    establishmentCounty: string;
    establishmentCity: string;
    officeProvince: string;
    officeCounty: string;
    officeCity: string;
    registrationDate: string;
    activityStartDate: string;
    municipalityZone: string;
    mainStreet: string;
    subStreet: string;
    mainAlley: string;
    subAlley: string;
    block: string;
    plaque: string;
    floor: string;
    unit: string;
    areaCode: string;
    fax: string;
    repFullName: string;
    repIdNumber: string;
    repLandline: string;
    repMobile: string;
    repNationalCode: string;
    repAddress: string;
    repPostalCode: string;
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
    dealershipManagerName: string;
    formDate: string;                  // تاریخ عمومی فرم پیش‌ثبت‌نام و تکمیل فرم
    contractNumber: string;            // شماره قرارداد
    contractDate: string;              // تاریخ قرارداد
    registrationRequestNumber: string; // شماره فرم درخواست ثبت نام
    registrationRequestDate: string;   // تاریخ فرم درخواست ثبت نام

    // --- 2. مشخصات خودرو و تحویل ---
    vehicleQuantity: number;           // تعداد دستگاه خودرو (پیش‌فرض ۱)
    carModel: string;                  // نوع / مدل خودرو
    modelYear: string;                 // سال ساخت (مدل)
    color: string;
    chassisNumber: string;
    engineNumber: string;
    invoiceOrBillRef: string;          // طبق فاکتور / مبایعه‌نامه
    deliveryProvince: string;          // استان محل تحویل
    deliveryCounty: string;            // شهرستان محل تحویل
    deliveryCity: string;              // شهر محل تحویل

    // --- 3. شرایط مالی و اقساط ---
    cashPriceRials: number;            // قیمت فروش نقدی / ثمن مورد معامله
    installmentTotalPriceRials: number;// قیمت فروش اقساطی با احتساب سود
    prepaymentRials: number;           // پیش پرداخت
    remainingAmountRials: number;      // الباقی ثمن معامله (اصل تسهیلات)
    installmentsCount: number;         // تعداد قسط
    installmentIntervalMonths: number; // تناوب ماهانه (مثلا ۱ یا ۳ ماهه)
    annualProfitPercent: number;       // نرخ سود سالانه درصد
    contractDurationMonths: number;    // مدت قرارداد (ماه شمسی)
    contractStartDate: string;         // از تاریخ
    contractEndDate: string;           // لغایت تاریخ
    checks: LeasingCheckRow[];         // جدول چک‌های اقساط (ماده ۵)

    // --- تضامین ماده ۷ و ماده ۳۶ ---
    guarantee120PercentRials: number;  // مبلغ تضمین ۱۲۰٪ تسهیلات (اصل + سود)
    guaranteeChecks: LeasingCheckRow[];// جدول چک/سفته تضمین (ماده ۷ صفحه ۳)
    article36FacilityTotalRials: number;   // مبلغ اصل و فرع تسهیلات (ماده ۳۶)
    article36ObligationCheckRials: number; // مبلغ چک تعهدات (بند ۱۰ ماده ۳۶)

    // --- 4. طرفین قرارداد: خریدار (حقیقی و حقوقی) و ضامن‌ها ---
    buyer: LeasingPersonInfo;
    legalBuyer: LeasingLegalEntity;
    legalCustomerExtra: LeasingLegalCustomerExtra;
    guarantorMode: 'natural' | 'corporate'; // ضامن حقیقی (۲ نفر) یا نسخه جدید ضامن شرکتی
    guarantor1: LeasingPersonInfo;
    guarantor2: LeasingPersonInfo;
    corporateGuarantor: LeasingLegalEntity;
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

    // --- 7. تعویض پلاک، الحاقیه، عودت چک تعویض پلاک و فک رهن ---
    plateChangeCheck: {
        amountRials: number;
        checkDate: string;
        checkNumber: string;
        issuerName: string;
        issuerNationalCode: string;
        bankName: string;
    };
    plateReturnRequest: {
        letterNumber: string;
        letterDate: string;
        attachment: string;
        receiptReferralDate: string;
    };
    mortgageReleaseOptions: {
        guaranteeDocs: boolean;          // الف - عودت اسناد ضمانت قرارداد
        earlySettlementChecks: boolean;  // ب - استرداد چک‌های اقساط تسویه زودتر از موعد
        mortgageReleaseLetter: boolean;  // ج - ارائه نامه فک رهن خودرو
        bouncedCheck: boolean;           // د - استرداد چک برگشتی
        bankDepositChecks: boolean;      // ه - استرداد چک‌های تسهیلات بابت واریز بانکی
        presenterName: string;           // نام ارائه‌دهنده اسناد
    };
}
