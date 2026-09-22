export type BankLetterType = 'CORPORATE' | 'PERSONAL';
export type BankAccountType = 'COMPANY' | 'INDIVIDUAL';
export type BankLetterStatus = 'DRAFT' | 'ISSUED' | 'PRINTED';

export interface SavedBankAccount {
    id: string;
    accountHolderName: string; // e.g. شرکت حسینی خودرو شیراز / امیر رضا محمدی پیراهی
    shebaNumber: string; // 24 digits e.g. 590130100000000358157511 or with IR prefix
    bankName: string; // e.g. بانک رفاه کارگران، بانک سینا، بانک ملت
    bankCode?: string; // 3 digit code e.g. 013, 059, 012
    accountType: BankAccountType; // COMPANY or INDIVIDUAL
    accountNumber?: string;
    branchName?: string;
    isDefault?: boolean;
    description?: string;
    createdAt?: string;
}

export interface BankLetter {
    id: string;
    letterNumber: string; // شماره نامه e.g. 1405/KM2606/1042
    letterDate: string; // تاریخ صدور e.g. 1405/06/15
    letterType: BankLetterType; // شرکتی یا شخصی
    
    // Addressee (بانک مقصد)
    destinationBankName: string; // e.g. بانک ملی، بانک ملت، بانک صادرات
    destinationBranchName?: string; // e.g. شعبه مرکزی شیراز

    // Customer / Introducee (شخص معرفی شده)
    customerTitle: string; // خانم / آقای / شرکت / مدیریت محترم
    customerName: string; // e.g. نوش آفرین گورنگی، زهرا غفاریان
    customerNationalCode: string; // کد ملی ۱۰ رقمی

    // Financial
    amountRials: number; // مبلغ به ریال e.g. 25000000000
    amountWords?: string; // مبلغ به حروف
    paymentMethod: string; // حواله ساتنا / حواله پایا / واریز نقدی / چک رمزدار بانکی

    // Beneficiary Account (حساب مقصد واریز)
    shebaNumber: string; // شماره شبا ۲۴ رقمی
    beneficiaryBankName: string; // نام بانک شبا (e.g. بانک رفاه کارگران، بانک سینا، بانک ملت)
    accountHolderName: string; // نام صاحب حساب بنام ... (شرکت حسینی خودرو شیراز / شخص)
    accountHolderType: BankAccountType;

    // Vehicle Details (مشخصات خودرو)
    carModel: string; // e.g. KMC eagle, BAC X3 pro, KMC J7, KMC T8, KMC X5, KMC A5
    carModelYear: string; // e.g. 1405, 1404
    carColor: string; // e.g. سفید، مشکی، خاکستری طوسی

    // Dealership & Sign-off
    dealershipName: string; // نمایندگی ۲۶۰۶ کرمان موتور (شرکت حسینی خودرو شیراز)
    signatoryTitle?: string; // مدیریت نمایندگی ۲۶۰۶ کرمان موتور

    notes?: string;
    status: BankLetterStatus;
    createdBy?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ShebaValidationResult {
    isValid: boolean;
    rawDigits: string;
    formattedSheba: string;
    fullIban: string;
    bankInfo: {
        code: string;
        name: string;
        logoName?: string;
        themeColor?: string;
    } | null;
    errorMessage?: string;
}

export interface NationalCodeValidationResult {
    isValid: boolean;
    cleanCode: string;
    errorMessage?: string;
    cityHint?: string;
}

export interface PostalCodeValidationResult {
    isValid: boolean;
    cleanCode: string;
    formattedCode: string;
    provinceHint?: string;
    errorMessage?: string;
}

export interface MobileValidationResult {
    isValid: boolean;
    cleanNumber: string;
    formattedNumber: string;
    operatorName?: string;
    operatorColor?: string;
    errorMessage?: string;
}

// --- قرارداد صلح خودرو (Vehicle Peace Agreement) ---
export interface CarPeaceContract {
    id: string;
    contractNumber: string; // شماره قرارداد صلح e.g. 1405/PC/1001
    contractDate: string; // تاریخ صلحنامه e.g. 1405/06/22
    transactionTime: string; // ساعت انجام معامله e.g. 11:30

    // مصالح (First Party / Releasor)
    releasorName: string; // شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی
    releasorNationalId: string; // 14012274787
    releasorAddress: string; // شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال
    releasorPostalCode: string; // 7173714734
    releasorPhone: string; // 09370518538

    // متصالح (Second Party / Releasee)
    releaseeTitle: string; // آقای / خانم
    releaseeName: string; // نام و نام خانوادگی
    releaseeFatherName: string; // فرزند
    releaseeIdNumber: string; // شماره شناسنامه
    releaseeIssuePlace: string; // صادره از
    releaseeNationalCode: string; // کد ملی (۱۰ رقم)
    releaseeAddress: string; // آدرس
    releaseePostalCode: string; // کد پستی (۱۰ رقم)
    releaseePhone: string; // شماره تلفن همراه

    // مورد صلح (Vehicle Subject)
    carModel: string; // یک دستگاه خودروی ...
    chassisNumber: string; // شماره شاسی
    plateNumber: string; // شماره پلاک انتظامی
    modelYear: string; // مدل e.g. 1405
    color: string; // رنگ e.g. سفید

    // مبلغ مورد صلح و پرداخت
    totalAmountRials: number; // مبلغ مورد صلح به ریال
    paidAmountRials: number; // مبلغ واریز شده به ریال
    trackingNumber: string; // شماره پیگیری واریز

    // اطلاعات حساب بانکی متصالح (ماده ۵)
    releaseeAccountNumber: string; // شماره حساب متصالح
    releaseeShebaNumber: string; // شماره شبا متصالح
    releaseeBankName: string; // نام بانک متصالح

    notes?: string;
    status: 'DRAFT' | 'SIGNED' | 'ARCHIVED';
    createdAt: string;
    updatedAt?: string;
}

