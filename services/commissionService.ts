import { CommissionDeal, CommissionPeriod, CommissionCategory, CarYardItem, CommissionSettings } from '../types';

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
    anbarRate: 0.05, // 0.05% از نرخ فروش
    azadRate: 10, // 10% از سود کمیسیون
    azadFlatRate: 0.05, // 0.05% از نرخ فروش در صورت عدم سود
    havalehRate: 0.05, // 0.05% از نرخ فروش
    leasingRate: 0.1, // 0.1% از پیش‌پرداخت
    registrationRate: 0.1, // 0.1% از پیش‌پرداخت
    lossPenaltyRate: 0.25 // 0.25% از نرخ فروش در صورت منفی شدن سود/زیان روز
};

export const INITIAL_COMMISSION_PERIODS: CommissionPeriod[] = [];
export const INITIAL_COMMISSION_DEALS: CommissionDeal[] = [];
export const INITIAL_CAR_YARD_ITEMS: CarYardItem[] = [];

export const SAMPLE_COMMISSION_PERIODS: CommissionPeriod[] = [
    {
        id: '1405-05',
        title: 'مرداد ۱۴۰۵',
        startDate: '1405/05/01',
        endDate: '1405/05/31',
        adjustments: {
            'ندا قاسمی': { bonus: 0, deductions: 0, notes: 'سهم پورسانت انبار ۵,۸۳۷,۵۰۰ ریال پرداخت شده' },
            'درسا محمدی': { bonus: 0, deductions: 0, notes: '' },
            'عرشیا عسکری': { bonus: 0, deductions: 0, notes: '' },
            'محمد مبین غلامی': { bonus: 0, deductions: 0, notes: '' },
            'طرلان منوچهری': { bonus: 0, deductions: 0, notes: '' },
            'شبنم کشاورز': { bonus: 0, deductions: 0, notes: '' },
            'امین رضا موسوی اصل': { bonus: 0, deductions: 0, notes: '' },
            'هیلدا منوچهری': { bonus: 0, deductions: 0, notes: '' },
            'مرضیه ایران نژاد': { bonus: 0, deductions: 0, notes: '' },
            'مریم یوسفی': { bonus: 0, deductions: 0, notes: '' },
            'زهرا زارع': { bonus: 0, deductions: 0, notes: '' },
            'محسن موسوی': { bonus: 0, deductions: 0, notes: '' }
        }
    },
    {
        id: '1405-04',
        title: 'تیر ۱۴۰۵',
        startDate: '1405/04/01',
        endDate: '1405/04/31'
    }
];

export const SAMPLE_COMMISSION_DEALS: CommissionDeal[] = [
    // ----------------------------------------------------
    // 1. فروش انبار (مرداد ۱۴۰۵) - 7 Deals from Excel
    // ----------------------------------------------------
    {
        id: 'deal-anbar-1',
        rowNumber: 1,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/10',
        salesPerson: 'درسا محمدی',
        customerName: 'هدیه توکلی ریشهری',
        carModel: '(1405) eagle',
        purchasePrice: 21000000000,
        dailyPrice: 24500000000,
        salePrice: 24600000000,
        dailyProfitLoss: 100000000,
        grossProfit: 3600000000,
        commissionRate: 0.05,
        commissionAmount: 12300000,
        paidCommissionShare: 12300000,
        paymentStatus: 'PAID',
        paymentNotes: 'تسویه کامل'
    },
    {
        id: 'deal-anbar-2',
        rowNumber: 2,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/12',
        salesPerson: 'درسا محمدی',
        customerName: 'شیما پیروانی نیا',
        carModel: '(1404) j4',
        purchasePrice: 12350651000,
        dailyPrice: 22500000000,
        salePrice: 22500000000,
        dailyProfitLoss: 0,
        grossProfit: 10149349000,
        commissionRate: 0.05,
        commissionAmount: 11250000,
        paidCommissionShare: 50000000, // 5 میلیون تومان
        paymentStatus: 'PAID',
        paymentDate: '1405/05/18',
        paymentNotes: 'در تاریخ 1405/05/18 پورسانت واریز شد به مبلغ 5 میلیون تومان'
    },
    {
        id: 'deal-anbar-3',
        rowNumber: 3,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/18',
        salesPerson: 'طرلان منوچهری',
        customerName: 'سید محمود موسوی',
        carModel: '(1404) j4',
        purchasePrice: 12350651000,
        dailyPrice: 22000000000,
        salePrice: 22000000000,
        dailyProfitLoss: 0,
        grossProfit: 9649349000,
        commissionRate: 0.05,
        commissionAmount: 11000000,
        paidCommissionShare: 50000000, // 5 میلیون تومان
        paymentStatus: 'PAID',
        paymentDate: '1405/05/18',
        paymentNotes: 'در تاریخ 1405/05/18 پورسانت واریز شد به مبلغ 5 میلیون تومان'
    },
    {
        id: 'deal-anbar-4',
        rowNumber: 4,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/19',
        salesPerson: 'محمد مبین غلامی',
        customerName: 'اکبر نجف آبادی پور',
        carModel: '(1405) t9',
        purchasePrice: 34500346000,
        dailyPrice: 67000000000,
        salePrice: 67500000000,
        dailyProfitLoss: 500000000,
        grossProfit: 32999654000,
        commissionRate: 0.05,
        commissionAmount: 33750000,
        paidCommissionShare: 33750000,
        paymentStatus: 'PAID',
        paymentNotes: 'تسویه کامل'
    },
    {
        id: 'deal-anbar-5',
        rowNumber: 5,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/20',
        salesPerson: 'طرلان منوچهری',
        customerName: 'پریا توکلیان',
        carModel: '(1405) j4',
        purchasePrice: 15378150000,
        dailyPrice: 24000000000,
        salePrice: 23350000000,
        dailyProfitLoss: -650000000,
        grossProfit: 7971850000,
        commissionRate: 0.25,
        commissionAmount: 58375000,
        paidCommissionShare: 29187500, // سهم پرداختی ۵۰٪
        paymentStatus: 'PARTIAL',
        paymentNotes: 'زیان روز: محاسبه بر مبنای ۰.۲۵٪ نرخ فروش'
    },
    {
        id: 'deal-anbar-6',
        rowNumber: 6,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/20',
        salesPerson: 'طرلان منوچهری',
        customerName: 'پریا توکلیان',
        carModel: '(1405) j4',
        purchasePrice: 15378150000,
        dailyPrice: 24000000000,
        salePrice: 23350000000,
        dailyProfitLoss: -650000000,
        grossProfit: 7971850000,
        commissionRate: 0.25,
        commissionAmount: 58375000,
        paidCommissionShare: 58375000,
        paymentStatus: 'PAID',
        paymentNotes: 'زیان روز: محاسبه بر مبنای ۰.۲۵٪ نرخ فروش'
    },
    {
        id: 'deal-anbar-7',
        rowNumber: 7,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'ANBAR',
        saleDate: '1405/05/20',
        salesPerson: 'شبنم کشاورز',
        customerName: 'سید علیرضا سماچی',
        carModel: '(1405) eagle',
        purchasePrice: 21000000000,
        dailyPrice: 24250000000,
        salePrice: 24000000000,
        dailyProfitLoss: -250000000,
        grossProfit: 3000000000,
        commissionRate: 0.25,
        commissionAmount: 60000000,
        paidCommissionShare: 60000000,
        paymentStatus: 'PAID',
        paymentNotes: 'زیان روز: محاسبه بر مبنای ۰.۲۵٪ نرخ فروش'
    },

    // ----------------------------------------------------
    // 2. فروش آزاد (مرداد ۱۴۰۵) - 8 Deals from Excel
    // ----------------------------------------------------
    {
        id: 'deal-azad-1',
        rowNumber: 1,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/01',
        saleDate: '1405/05/01',
        salesPerson: 'درسا محمدی',
        sellerName: 'علی هوشمند سروستانی',
        buyerName: 'کیانا نگهداری',
        customerName: 'کیانا نگهداری',
        carModel: '(1404) x3',
        dailyPrice: 29000000000,
        purchasePrice: 29000000000,
        salePrice: 29800000000,
        grossProfit: 800000000, // کمیسیون کل معامله
        commissionAmount: 80000000, // ۱۰٪ کمیسیون
        paidCommissionShare: 80000000,
        paymentStatus: 'PAID',
        paymentNotes: '۱۰٪ سود کمیسیون کل'
    },
    {
        id: 'deal-azad-2',
        rowNumber: 2,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/03',
        saleDate: '1405/05/03',
        salesPerson: 'محمد مبین غلامی',
        sellerName: 'شرکت مدیریت اطلاعات نوین',
        buyerName: 'زهرا فرنام',
        customerName: 'زهرا فرنام',
        carModel: '(1403) ej7+',
        dailyPrice: 38000000000,
        purchasePrice: 36000000000,
        salePrice: 38000000000,
        grossProfit: 2000000000,
        commissionAmount: 200000000, // ۱۰٪ کمیسیون
        paidCommissionShare: 200000000,
        paymentStatus: 'PAID'
    },
    {
        id: 'deal-azad-3',
        rowNumber: 3,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/07',
        saleDate: '1405/05/07',
        salesPerson: 'درسا محمدی / ندا قاسمی',
        sharedPersons: ['درسا محمدی', 'ندا قاسمی'],
        sellerName: 'ایمان پیراحمدیان',
        buyerName: 'مهسامحمد زاده',
        customerName: 'مهسامحمد زاده',
        carModel: '(1404) j7',
        dailyPrice: 44000000000,
        purchasePrice: 44000000000,
        salePrice: 44850000000,
        grossProfit: 850000000,
        commissionAmount: 85000000,
        paidCommissionShare: 42500000, // ۵۰٪ هر نفر
        paymentStatus: 'PAID',
        paymentNotes: 'تسهیم ۵۰٪ بین درسا محمدی و ندا قاسمی (هر کدام ۴۲.۵ م ریال)'
    },
    {
        id: 'deal-azad-4',
        rowNumber: 4,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/08',
        saleDate: '1405/05/08',
        salesPerson: 'محمد مبین غلامی / ندا قاسمی',
        sharedPersons: ['محمد مبین غلامی', 'ندا قاسمی'],
        sellerName: 'مسعود آزادی',
        buyerName: 'مریم منعمیان',
        customerName: 'مریم منعمیان',
        carModel: '(1404) sr6',
        dailyPrice: 49800000000,
        purchasePrice: 49300000000,
        salePrice: 50300000000,
        grossProfit: 1000000000,
        commissionAmount: 100000000,
        paidCommissionShare: 50000000, // ۵۰٪ هر نفر
        paymentStatus: 'PAID',
        paymentNotes: 'تسهیم ۵۰٪ بین مبین غلامی و ندا قاسمی (هر کدام ۵۰ م ریال)'
    },
    {
        id: 'deal-azad-5',
        rowNumber: 5,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/10',
        saleDate: '1405/05/10',
        salesPerson: 'محمد مبین غلامی',
        sellerName: 'سکینه قنبری',
        buyerName: 'حسین آرمان فر',
        customerName: 'حسین آرمان فر',
        carModel: '(1403) x3',
        dailyPrice: 25000000000,
        purchasePrice: 25000000000,
        salePrice: 25500000000,
        grossProfit: 500000000,
        commissionAmount: 50000000,
        paidCommissionShare: 50000000,
        paymentStatus: 'PAID'
    },
    {
        id: 'deal-azad-6',
        rowNumber: 6,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/11',
        saleDate: '1405/05/11',
        salesPerson: 'طرلان منوچهری',
        sellerName: 'زهرا فلاح مبرهن گشنی (خانم آزاده حسینی)',
        buyerName: 'سید رحیم موسوی',
        customerName: 'سید رحیم موسوی',
        carModel: '(1405) sr3',
        dailyPrice: 36000000000,
        purchasePrice: 37000000000,
        salePrice: 35850000000,
        grossProfit: -1150000000, // زیان
        commissionAmount: 17925000, // 0.05% از نرخ فروش
        paidCommissionShare: 17925000,
        paymentStatus: 'PAID',
        paymentNotes: 'معامله با زیان: محاسبه بر مبنای ۰.۰۵٪ کل نرخ فروش'
    },
    {
        id: 'deal-azad-7',
        rowNumber: 7,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/14',
        saleDate: '1405/05/18',
        salesPerson: 'ندا قاسمی',
        sellerName: 'محمد تقی نجابت',
        buyerName: 'لیلا احیاء',
        customerName: 'لیلا احیاء',
        carModel: '(1404) x3',
        dailyPrice: 29000000000,
        purchasePrice: 27500000000,
        salePrice: 28000000000,
        grossProfit: 500000000,
        commissionAmount: 50000000,
        paidCommissionShare: 50000000,
        paymentStatus: 'PAID'
    },
    {
        id: 'deal-azad-8',
        rowNumber: 8,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'AZAD',
        purchaseDate: '1405/05/25',
        saleDate: '1405/05/25',
        salesPerson: 'عرشیا عسکری',
        sellerName: 'خانم آزاده حسینی',
        buyerName: 'علی سلیمی اکبر آبادی',
        customerName: 'علی سلیمی اکبر آبادی',
        carModel: '(1399) s5',
        dailyPrice: 28000000000,
        purchasePrice: 28000000000,
        salePrice: 28500000000,
        grossProfit: 500000000,
        commissionAmount: 50000000,
        paidCommissionShare: 50000000,
        paymentStatus: 'PAID'
    },

    // ----------------------------------------------------
    // 3. فروش حواله (مرداد ۱۴۰۵) - 2 Deals from Excel
    // ----------------------------------------------------
    {
        id: 'deal-havaleh-1',
        rowNumber: 1,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'HAVALEH',
        saleDate: '1405/05/18',
        salesPerson: 'محمد مبین غلامی',
        customerName: 'فهمیه پیروی',
        carModel: '(1405) eagle',
        dailyPrice: 24000000000,
        purchasePrice: 21000000000,
        salePrice: 24000000000,
        nextBasketAmount: 26500000000,
        dailyProfitLoss: -2500000000,
        commissionRate: 0.25,
        commissionAmount: 60000000, // 0.25% از نرخ فروش در زیان روز
        paidCommissionShare: 60000000,
        paymentStatus: 'PAID',
        paymentNotes: 'زیان روز: محاسبه بر مبنای ۰.۲۵٪ نرخ فروش'
    },
    {
        id: 'deal-havaleh-2',
        rowNumber: 2,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'HAVALEH',
        saleDate: '1405/05/20',
        salesPerson: 'عرشیا عسکری',
        customerName: 'پردیس زاهدی',
        carModel: '(1405) eagle',
        dailyPrice: 23500000000,
        purchasePrice: 21000000000,
        salePrice: 23500000000,
        nextBasketAmount: 26500000000,
        dailyProfitLoss: -3000000000,
        commissionRate: 0.25,
        commissionAmount: 58750000, // 0.25% از نرخ فروش در زیان روز
        paidCommissionShare: 58750000,
        paymentStatus: 'PAID',
        paymentNotes: 'زیان روز: محاسبه بر مبنای ۰.۲۵٪ نرخ فروش'
    },

    // ----------------------------------------------------
    // 4. فروش لیزینگ و اقساط (مرداد ۱۴۰۵) - 2 Deals from Excel
    // ----------------------------------------------------
    {
        id: 'deal-leasing-1',
        rowNumber: 1,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'LEASING',
        saleDate: '1405/05/01',
        salesPerson: 'درسا محمدی',
        customerName: 'محبوبه موسوی',
        carModel: 'eagle',
        downPayment: 15000000000,
        commissionRate: 0.10,
        commissionAmount: 15000000, // ۰.۱٪ پیش‌پرداخت
        paidCommissionShare: 15000000,
        paymentStatus: 'PAID'
    },
    {
        id: 'deal-leasing-2',
        rowNumber: 2,
        periodId: '1405-05',
        periodName: 'مرداد ۱۴۰۵',
        category: 'LEASING',
        saleDate: '1405/05/07',
        salesPerson: 'عرشیا عسکری',
        customerName: 'سید صمد هاشمی',
        carModel: 'eagle',
        downPayment: 15000000000,
        commissionRate: 0.10,
        commissionAmount: 15000000, // ۰.۱٪ پیش‌پرداخت
        paidCommissionShare: 15000000,
        paymentStatus: 'PAID'
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

// Helper to calculate category specific formulas
export function calculateCommissionForCategory(
    category: CommissionCategory,
    params: {
        salePrice: number;
        purchasePrice?: number;
        dailyPrice?: number;
        nextBasketAmount?: number;
        downPayment?: number;
        commissionRate?: number;
    },
    customSettings?: CommissionSettings
): {
    dailyProfitLoss: number;
    grossProfit: number;
    commissionAmount: number;
    effectiveRate: number;
    isLossPenalty: boolean;
} {
    const settings = customSettings || getCommissionSettings();
    const salePrice = params.salePrice || 0;
    const purchasePrice = params.purchasePrice || 0;
    const dailyPrice = params.dailyPrice || 0;
    const nextBasketAmount = params.nextBasketAmount || 0;
    const downPayment = params.downPayment || 0;

    let dailyProfitLoss = 0;
    let grossProfit = 0;
    let commissionAmount = 0;
    let effectiveRate = 0;
    let isLossPenalty = false;

    switch (category) {
        case 'ANBAR': {
            dailyProfitLoss = dailyPrice > 0 ? (salePrice - dailyPrice) : 0;
            grossProfit = purchasePrice > 0 ? (salePrice - purchasePrice) : 0;
            if (dailyProfitLoss < 0) {
                // وقتی سود و زیان روز منفی می‌شود: فرمول محاسبه درصد جریمه زیان روز (پیش‌فرض ۰.۲۵٪)
                isLossPenalty = true;
                effectiveRate = settings.lossPenaltyRate;
                commissionAmount = Math.round(salePrice * (settings.lossPenaltyRate / 100));
            } else {
                effectiveRate = settings.anbarRate;
                commissionAmount = Math.round(salePrice * (settings.anbarRate / 100));
            }
            break;
        }

        case 'AZAD': {
            grossProfit = salePrice - purchasePrice; // کمیسیون کل معامله
            dailyProfitLoss = dailyPrice > 0 ? (salePrice - dailyPrice) : 0;
            if (dailyProfitLoss < 0) {
                // در صورت زیان روز: فرمول درصد جریمه زیان روز
                isLossPenalty = true;
                effectiveRate = settings.lossPenaltyRate;
                commissionAmount = Math.round(salePrice * (settings.lossPenaltyRate / 100));
            } else if (grossProfit > 0) {
                effectiveRate = settings.azadRate;
                commissionAmount = Math.round(grossProfit * (settings.azadRate / 100));
            } else {
                effectiveRate = settings.azadFlatRate;
                commissionAmount = Math.round(salePrice * (settings.azadFlatRate / 100));
            }
            break;
        }

        case 'HAVALEH': {
            dailyProfitLoss = nextBasketAmount > 0 ? (salePrice - nextBasketAmount) : (salePrice - dailyPrice);
            grossProfit = purchasePrice > 0 ? (salePrice - purchasePrice) : 0;
            if (dailyProfitLoss < 0) {
                // وقتی سود و زیان روز منفی می‌شود: فرمول محاسبه درصد زیان روز
                isLossPenalty = true;
                effectiveRate = settings.lossPenaltyRate;
                commissionAmount = Math.round(salePrice * (settings.lossPenaltyRate / 100));
            } else {
                effectiveRate = settings.havalehRate;
                commissionAmount = Math.round(salePrice * (settings.havalehRate / 100));
            }
            break;
        }

        case 'LEASING': {
            grossProfit = 0;
            dailyProfitLoss = 0;
            effectiveRate = settings.leasingRate;
            commissionAmount = Math.round(downPayment * (settings.leasingRate / 100));
            break;
        }

        case 'REGISTRATION': {
            grossProfit = 0;
            dailyProfitLoss = 0;
            effectiveRate = settings.registrationRate;
            commissionAmount = downPayment > 0 
                ? Math.round(downPayment * (settings.registrationRate / 100)) 
                : 4510000;
            break;
        }

        default: {
            dailyProfitLoss = dailyPrice > 0 ? (salePrice - dailyPrice) : 0;
            grossProfit = purchasePrice > 0 ? (salePrice - purchasePrice) : 0;
            if (dailyProfitLoss < 0) {
                isLossPenalty = true;
                effectiveRate = settings.lossPenaltyRate;
                commissionAmount = Math.round(salePrice * (settings.lossPenaltyRate / 100));
            } else {
                effectiveRate = settings.anbarRate;
                commissionAmount = Math.round(salePrice * (settings.anbarRate / 100));
            }
        }
    }

    return { dailyProfitLoss, grossProfit, commissionAmount, effectiveRate, isLossPenalty };
}

// Split shared persons (e.g. "درسا محمدی / ندا قاسمی")
export function parseSalesPersons(salesPersonStr?: string): string[] {
    if (!salesPersonStr) return [];
    return salesPersonStr
        .split(/[/،+&]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// LocalStorage helpers
const STORAGE_KEY_DEALS = 'autolead_commission_deals_v2';
const STORAGE_KEY_PERIODS = 'autolead_commission_periods_v2';
const STORAGE_KEY_YARD = 'autolead_car_yard_v2';
const STORAGE_KEY_SETTINGS = 'autolead_commission_settings_v1';

export function getCommissionSettings(): CommissionSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_COMMISSION_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load commission settings', e);
    }
    return { ...DEFAULT_COMMISSION_SETTINGS };
}

export function saveCommissionSettings(settings: CommissionSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save commission settings', e);
    }
}

export function resetCommissionSettings(): CommissionSettings {
    saveCommissionSettings(DEFAULT_COMMISSION_SETTINGS);
    return { ...DEFAULT_COMMISSION_SETTINGS };
}

export function getCommissionDeals(): CommissionDeal[] {
    try {
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
        localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
    } catch (e) {
        console.error('Failed to save commission deals', e);
    }
}

export function getCommissionPeriods(): CommissionPeriod[] {
    try {
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
        localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods));
    } catch (e) {
        console.error('Failed to save commission periods', e);
    }
}

export function getCarYardItems(): CarYardItem[] {
    try {
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
