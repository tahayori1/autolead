import * as XLSX from 'xlsx';
import { CommissionDeal, CommissionPeriod, CommissionCategory, CarYardItem } from '../types';
import { parseSalesPersons } from './commissionService';

// Helper to format currency for Excel cells
const formatNumber = (num?: number): number => {
    return typeof num === 'number' && !isNaN(num) ? Math.round(num) : 0;
};

const getCategoryPersianName = (cat: CommissionCategory): string => {
    switch (cat) {
        case 'ANBAR': return 'فروش انبار';
        case 'AZAD': return 'فروش آزاد';
        case 'HAVALEH': return 'فروش حواله';
        case 'LEASING': return 'فروش لیزینگ و اقساط';
        case 'REGISTRATION': return 'ثبت نام و کارخانه';
        default: return 'سایر معاملات';
    }
};

const getPaymentStatusPersian = (status: string): string => {
    switch (status) {
        case 'PAID': return 'واریز شد (تسویه)';
        case 'PARTIAL': return 'علی‌الحساب';
        case 'PENDING': return 'در انتظار واریز';
        default: return status || 'نامشخص';
    }
};

/**
 * Full Multi-Sheet XLSX Export for AutoLead Commission System
 */
export function exportFullCommissionWorkbook({
    deals,
    periods,
    activePeriodId,
    yardItems = []
}: {
    deals: CommissionDeal[];
    periods: CommissionPeriod[];
    activePeriodId?: string;
    yardItems?: CarYardItem[];
}): void {
    const wb = XLSX.utils.book_new();

    // Determine target deals (either for active period or all if none selected)
    const targetPeriod = periods.find(p => p.id === activePeriodId);
    const activeDeals = activePeriodId ? deals.filter(d => d.periodId === activePeriodId) : deals;
    const periodTitle = targetPeriod?.title || (periods.length > 0 ? periods.map(p => p.title).join(' - ') : 'کلیه دوره‌ها');

    // ----------------------------------------------------
    // 1. Sheet 1: خلاصه مدیریتی و شاخص‌های مالی (Executive Summary)
    // ----------------------------------------------------
    const summaryData: any[][] = [
        ['گزارش جامع پورسانت و کارکرد معاملات خودرویی - هلدینگ حسینی خودرو'],
        ['دوره مالی:', periodTitle],
        ['تاریخ صدور گزارش:', new Date().toLocaleDateString('fa-IR')],
        [''],
        ['شاخص مالی کل', 'مبلغ (ریال)', 'مبلغ (تومان)', 'توضیحات'],
    ];

    let totalSales = 0;
    let totalPurchase = 0;
    let totalGrossProfit = 0;
    let totalDailyProfitLoss = 0;
    let totalCommission = 0;
    let totalPaidCommission = 0;

    activeDeals.forEach(d => {
        totalSales += (d.salePrice || d.downPayment || 0);
        totalPurchase += (d.purchasePrice || 0);
        totalGrossProfit += (d.grossProfit || 0);
        totalDailyProfitLoss += (d.dailyProfitLoss || 0);
        totalCommission += (d.commissionAmount || 0);
        if (d.paymentStatus === 'PAID') {
            totalPaidCommission += d.paidCommissionShare ?? d.commissionAmount;
        } else if (d.paymentStatus === 'PARTIAL') {
            totalPaidCommission += d.paidCommissionShare ?? 0;
        }
    });

    const pendingCommission = Math.max(0, totalCommission - totalPaidCommission);
    const payoutPct = totalCommission > 0 ? ((totalPaidCommission / totalCommission) * 100).toFixed(1) + '%' : '0%';

    summaryData.push(
        ['تعداد کل معاملات ثبت‌شده', activeDeals.length, '-', `${activeDeals.length} فقره قرارداد`],
        ['مجموع حجم فروش و پیش‌پرداخت‌ها', totalSales, Math.round(totalSales / 10), 'گردش مالی حاصل از فروش'],
        ['مجموع نرخ خرید خودروها', totalPurchase, Math.round(totalPurchase / 10), 'بهای تمام‌شده خرید خودروها'],
        ['سود ناخالص کل (مارجین ناخالص)', totalGrossProfit, Math.round(totalGrossProfit / 10), 'اختلاف نرخ فروش و نرخ خرید'],
        ['مجموع سود یا زیان نسبت به روز', totalDailyProfitLoss, Math.round(totalDailyProfitLoss / 10), 'اختلاف نرخ فروش و قیمت روز بازار'],
        ['کل پورسانت تعلق‌گرفته به پرسنل', totalCommission, Math.round(totalCommission / 10), 'محاسبه‌شده بر اساس قوانین و نرخ‌ها'],
        ['پورسانت‌های تسویه‌شده و واریزی', totalPaidCommission, Math.round(totalPaidCommission / 10), 'مبالغ قطعی پرداخت‌شده به مشاوران'],
        ['مانده پورسانت در انتظار پرداخت', pendingCommission, Math.round(pendingCommission / 10), 'تعهدات پرداخت‌نشده دوره'],
        ['درصد تحقق پرداخت پورسانت', payoutPct, '-', 'نسبت واریزی‌ها به کل تعهدات'],
        [''],
        ['تفکیک عملکرد بر اساس شیت و دسته‌بندی معامله:'],
        ['دسته‌بندی', 'تعداد معامله', 'حجم فروش (ریال)', 'سود ناخالص (ریال)', 'سود/زیان روز (ریال)', 'پورسانت (ریال)', 'نرخ محاسبه'],
    );

    const categories: CommissionCategory[] = ['ANBAR', 'AZAD', 'HAVALEH', 'LEASING', 'REGISTRATION'];
    categories.forEach(cat => {
        const catDeals = activeDeals.filter(d => d.category === cat);
        const catSales = catDeals.reduce((sum, d) => sum + (d.salePrice || d.downPayment || 0), 0);
        const catGross = catDeals.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
        const catDaily = catDeals.reduce((sum, d) => sum + (d.dailyProfitLoss || 0), 0);
        const catComm = catDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
        
        let rateDesc = '۰.۰۵٪ فروش';
        if (cat === 'AZAD') rateDesc = '۱۰٪ سود کمیسیون (یا ۰.۲۵٪ در زیان)';
        else if (cat === 'HAVALEH') rateDesc = '۰.۰۵٪ فروش (یا ۰.۲۵٪ در زیان)';
        else if (cat === 'LEASING') rateDesc = '۰.۱٪ پیش‌پرداخت';
        else if (cat === 'REGISTRATION') rateDesc = '۰.۱٪ پیش‌پرداخت';
        else if (cat === 'ANBAR') rateDesc = '۰.۰۵٪ فروش (یا ۰.۲۵٪ در زیان)';

        summaryData.push([
            getCategoryPersianName(cat),
            catDeals.length,
            catSales,
            catGross,
            catDaily,
            catComm,
            rateDesc
        ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 22 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'خلاصه مدیریتی');

    // ----------------------------------------------------
    // 2. Sheet 2: فروش انبار (ANBAR)
    // ----------------------------------------------------
    const anbarDeals = activeDeals.filter(d => d.category === 'ANBAR');
    if (anbarDeals.length > 0 || true) {
        const anbarHeaders = [
            'ردیف', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس / همکار', 'خریدار / مشتری',
            'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'نرخ فروش (ریال)',
            'سود یا زیان روز (ریال)', 'سود ناخالص (ریال)', 'درصد پورسانت', 'پورسانت کل (ریال)',
            'سهم پرداختی (ریال)', 'وضعیت واریز', 'تاریخ واریز', 'توضیحات واریز'
        ];
        const anbarRows = anbarDeals.map((d, i) => [
            i + 1,
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.customerName || d.buyerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.dailyPrice),
            formatNumber(d.salePrice),
            formatNumber(d.dailyProfitLoss),
            formatNumber(d.grossProfit),
            d.isManualCommission ? 'دستی' : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? '0.25%' : `${(d.commissionRate ? d.commissionRate * (d.commissionRate < 1 ? 100 : 1) : 0.05)}%`),
            formatNumber(d.commissionAmount),
            formatNumber(d.paidCommissionShare ?? (d.paymentStatus === 'PAID' ? d.commissionAmount : 0)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentDate || '',
            d.paymentNotes || (d.isManualCommission ? `تغییر دستی: ${d.manualCommissionReason || ''}` : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? 'زیان روز: ۰.۲۵٪ نرخ فروش' : ''))
        ]);

        const anbarWs = XLSX.utils.aoa_to_sheet([anbarHeaders, ...anbarRows]);
        anbarWs['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 22 },
            { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
            { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
            { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, anbarWs, 'فروش انبار');
    }

    // ----------------------------------------------------
    // 3. Sheet 3: فروش آزاد (AZAD)
    // ----------------------------------------------------
    const azadDeals = activeDeals.filter(d => d.category === 'AZAD');
    if (azadDeals.length > 0 || true) {
        const azadHeaders = [
            'ردیف', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس / همکار', 'فروشنده (مالک)', 'خریدار',
            'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'نرخ فروش (ریال)',
            'کمیسیون کل معامله / سود (ریال)', 'سود/زیان روز (ریال)', 'درصد پورسانت', 'پورسانت کل (ریال)',
            'سهم پرداختی (ریال)', 'وضعیت واریز', 'توضیحات واریز'
        ];
        const azadRows = azadDeals.map((d, i) => [
            i + 1,
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.sellerName || '',
            d.buyerName || d.customerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.dailyPrice),
            formatNumber(d.salePrice),
            formatNumber(d.grossProfit),
            formatNumber(d.dailyProfitLoss),
            d.isManualCommission ? 'دستی' : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? '0.25%' : (d.grossProfit && d.grossProfit > 0 ? '10%' : '0.05%')),
            formatNumber(d.commissionAmount),
            formatNumber(d.paidCommissionShare ?? (d.paymentStatus === 'PAID' ? d.commissionAmount : 0)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || (d.isManualCommission ? `تغییر دستی: ${d.manualCommissionReason || ''}` : '')
        ]);

        const azadWs = XLSX.utils.aoa_to_sheet([azadHeaders, ...azadRows]);
        azadWs['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 22 },
            { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
            { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
            { wch: 16 }, { wch: 18 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, azadWs, 'فروش آزاد');
    }

    // ----------------------------------------------------
    // 4. Sheet 4: فروش حواله (HAVALEH)
    // ----------------------------------------------------
    const havalehDeals = activeDeals.filter(d => d.category === 'HAVALEH');
    if (havalehDeals.length > 0 || true) {
        const havalehHeaders = [
            'ردیف', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس / همکار', 'نام خریدار',
            'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'مبلغ سبد بعدی (ریال)', 'نرخ فروش (ریال)',
            'سود یا زیان حواله / روز (ریال)', 'سود ناخالص (ریال)', 'درصد پورسانت', 'پورسانت کل (ریال)',
            'سهم پرداختی (ریال)', 'وضعیت واریز', 'توضیحات واریز'
        ];
        const havalehRows = havalehDeals.map((d, i) => [
            i + 1,
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.customerName || d.buyerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.dailyPrice),
            formatNumber(d.nextBasketAmount),
            formatNumber(d.salePrice),
            formatNumber(d.dailyProfitLoss),
            formatNumber(d.grossProfit),
            d.isManualCommission ? 'دستی' : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? '0.25%' : '0.05%'),
            formatNumber(d.commissionAmount),
            formatNumber(d.paidCommissionShare ?? (d.paymentStatus === 'PAID' ? d.commissionAmount : 0)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || (d.isManualCommission ? `تغییر دستی: ${d.manualCommissionReason || ''}` : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? 'زیان روز: ۰.۲۵٪ نرخ فروش' : ''))
        ]);

        const havalehWs = XLSX.utils.aoa_to_sheet([havalehHeaders, ...havalehRows]);
        havalehWs['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 22 },
            { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
            { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
            { wch: 16 }, { wch: 18 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, havalehWs, 'فروش حواله');
    }

    // ----------------------------------------------------
    // 5. Sheet 5: فروش لیزینگ و اقساط (LEASING)
    // ----------------------------------------------------
    const leasingDeals = activeDeals.filter(d => d.category === 'LEASING');
    if (leasingDeals.length > 0 || true) {
        const leasingHeaders = [
            'ردیف', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس', 'نام مشتری',
            'مدل خودرو', 'مبلغ پیش‌پرداخت (ریال)', 'درصد پورسانت', 'پورسانت محاسبه‌شده (ریال)',
            'سهم پرداختی (ریال)', 'وضعیت واریز', 'توضیحات'
        ];
        const leasingRows = leasingDeals.map((d, i) => [
            i + 1,
            d.saleDate || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.customerName || d.buyerName || '',
            d.carModel || '',
            formatNumber(d.downPayment),
            '0.10%',
            formatNumber(d.commissionAmount),
            formatNumber(d.paidCommissionShare ?? (d.paymentStatus === 'PAID' ? d.commissionAmount : 0)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || '۰.۱٪ مبلغ پیش‌پرداخت'
        ]);

        const leasingWs = XLSX.utils.aoa_to_sheet([leasingHeaders, ...leasingRows]);
        leasingWs['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 22 },
            { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 18 },
            { wch: 16 }, { wch: 18 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, leasingWs, 'لیزینگ و اقساط');
    }

    // ----------------------------------------------------
    // 6. Sheet 6: ثبت نام و کارخانه (REGISTRATION)
    // ----------------------------------------------------
    const regDeals = activeDeals.filter(d => d.category === 'REGISTRATION');
    if (regDeals.length > 0 || true) {
        const regHeaders = [
            'ردیف', 'تاریخ ثبت‌نام', 'شماره قرارداد', 'پرسنل فروش', 'قولنامه‌نویس / همکار', 'نام متقاضی',
            'مدل خودرو', 'پیش‌پرداخت / واریزی (ریال)', 'پورسانت (ریال)',
            'سهم پرداختی (ریال)', 'وضعیت واریز', 'تاریخ تحویل', 'توضیحات'
        ];
        const regRows = regDeals.map((d, i) => [
            i + 1,
            d.saleDate || '',
            d.contractNumber || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.customerName || '',
            d.carModel || '',
            formatNumber(d.downPayment),
            formatNumber(d.commissionAmount),
            formatNumber(d.paidCommissionShare ?? (d.paymentStatus === 'PAID' ? d.commissionAmount : 0)),
            getPaymentStatusPersian(d.paymentStatus),
            d.deliveryDate || '',
            d.paymentNotes || (d.isManualCommission ? `تغییر دستی: ${d.manualCommissionReason || ''}` : '')
        ]);

        const regWs = XLSX.utils.aoa_to_sheet([regHeaders, ...regRows]);
        regWs['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 22 },
            { wch: 16 }, { wch: 20 }, { wch: 16 },
            { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, regWs, 'ثبت نام کارخانه');
    }

    // ----------------------------------------------------
    // 7. Sheet 7: کارنامه تجمیعی و تسویه پرسنل (Personnel Summary)
    // ----------------------------------------------------
    const staffAggregates: Record<string, {
        dealCount: number;
        salesVolume: number;
        grossProfit: number;
        earnedCommission: number;
        paidCommission: number;
        dealsList: string[];
    }> = {};

    activeDeals.forEach(deal => {
        const persons = deal.sharedPersons && deal.sharedPersons.length > 0
            ? deal.sharedPersons
            : parseSalesPersons(deal.salesPerson);
        const shareFraction = 1 / (persons.length || 1);

        const dealVolume = (deal.salePrice || deal.downPayment || 0) * shareFraction;
        const dealProfit = (deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0)) * shareFraction;
        const dealComm = (deal.commissionAmount || 0) * shareFraction;
        const dealPaid = (deal.paymentStatus === 'PAID' 
            ? (deal.paidCommissionShare !== undefined ? deal.paidCommissionShare : deal.commissionAmount) 
            : (deal.paidCommissionShare || 0)) * shareFraction;

        persons.forEach(person => {
            if (!staffAggregates[person]) {
                staffAggregates[person] = {
                    dealCount: 0,
                    salesVolume: 0,
                    grossProfit: 0,
                    earnedCommission: 0,
                    paidCommission: 0,
                    dealsList: []
                };
            }
            staffAggregates[person].dealCount += shareFraction;
            staffAggregates[person].salesVolume += dealVolume;
            staffAggregates[person].grossProfit += dealProfit;
            staffAggregates[person].earnedCommission += dealComm;
            staffAggregates[person].paidCommission += dealPaid;
            staffAggregates[person].dealsList.push(`${deal.carModel} (${deal.customerName || 'مشتری'})`);
        });
    });

    const staffHeaders = [
        'ردیف', 'نام و نام خانوادگی مشاور', 'تعداد معامله (سهم)', 'حجم فروش کل (ریال)',
        'سودآوری کل (ریال)', 'پورسانت ناخالص (ریال)', 'پاداش تشویقی (ریال)', 'کسورات و جریمه (ریال)',
        'خالص پورسانت دوره (ریال)', 'مبلغ پرداخت‌شده (ریال)', 'مانده قابل پرداخت (ریال)', 'وضعیت تسویه', 'یادداشت'
    ];

    const adjustments = targetPeriod?.adjustments || {};
    const staffRows = Object.entries(staffAggregates)
        .sort((a, b) => b[1].earnedCommission - a[1].earnedCommission)
        .map(([name, data], idx) => {
            const adj = adjustments[name] || { bonus: 0, deductions: 0, notes: '' };
            const netCommission = data.earnedCommission + (adj.bonus || 0) - (adj.deductions || 0);
            const remaining = Math.max(0, netCommission - data.paidCommission);
            const statusStr = remaining <= 0 ? 'تسویه کامل' : (data.paidCommission > 0 ? 'تسویه علی‌الحساب' : 'پرداخت‌نشده');

            return [
                idx + 1,
                name,
                Number(data.dealCount.toFixed(1)),
                formatNumber(data.salesVolume),
                formatNumber(data.grossProfit),
                formatNumber(data.earnedCommission),
                formatNumber(adj.bonus),
                formatNumber(adj.deductions),
                formatNumber(netCommission),
                formatNumber(data.paidCommission),
                formatNumber(remaining),
                statusStr,
                adj.notes || ''
            ];
        });

    const staffWs = XLSX.utils.aoa_to_sheet([staffHeaders, ...staffRows]);
    staffWs['!cols'] = [
        { wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, staffWs, 'کارنامه پرسنل و تسویه');

    // ----------------------------------------------------
    // 8. Sheet 8: کاردکس انبار و موجودی خودروها (Car Yard Ledger)
    // ----------------------------------------------------
    if (yardItems && yardItems.length > 0) {
        const yardHeaders = [
            'ردیف', 'نوع و مدل خودرو', 'رنگ', 'شماره شاسی', 'شماره پلاک',
            'مالک سند', 'تاریخ ورود', 'تاریخ ترخیص', 'محل نگهداری', 'تحویل‌دهنده', 'وضعیت', 'توضیحات'
        ];
        const yardRows = yardItems.map((item, idx) => [
            idx + 1,
            item.carModel,
            item.carColor,
            item.chassisNumber || '',
            item.plateNumber || '',
            item.ownerName,
            item.entryDate,
            item.releaseDate || '',
            item.storageLocation,
            item.deliveredBy,
            item.status === 'PARKED' ? 'در پارکینگ' : (item.status === 'RELEASED' ? 'ترخیص شده' : 'در حال تعمیر'),
            item.notes || ''
        ]);

        const yardWs = XLSX.utils.aoa_to_sheet([yardHeaders, ...yardRows]);
        yardWs['!cols'] = [
            { wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
            { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 25 }
        ];
        XLSX.utils.book_append_sheet(wb, yardWs, 'کاردکس انبار خودرو');
    }

    // Generate sanitized file name
    const sanitizedTitle = (periodTitle || 'Commission_Report').replace(/[/\\?%*:|"<> ]/g, '_');
    const fileName = `گزارش_جامع_پورسانت_${sanitizedTitle}.xlsx`;

    // Trigger File Download in browser
    XLSX.writeFile(wb, fileName);
}

/**
 * Export Single Category Sheet to XLSX
 */
export function exportSingleCategoryXLSX(
    deals: CommissionDeal[],
    category: CommissionCategory,
    periodTitle: string
): void {
    const wb = XLSX.utils.book_new();
    const catName = getCategoryPersianName(category);
    const catDeals = deals.filter(d => d.category === category);

    const headers = [
        'ردیف', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس / همکار', 'خریدار / مشتری',
        'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'نرخ فروش / پیش پرداخت (ریال)',
        'سود/زیان روز (ریال)', 'سود ناخالص (ریال)', 'پورسانت کل (ریال)', 'وضعیت واریز', 'توضیحات'
    ];

    const rows = catDeals.map((d, i) => [
        i + 1,
        d.purchaseDate || '',
        d.saleDate || '',
        d.salesPerson || '',
        d.contractWriter || '',
        d.customerName || d.buyerName || '',
        d.carModel || '',
        formatNumber(d.purchasePrice),
        formatNumber(d.dailyPrice),
        formatNumber(d.salePrice || d.downPayment),
        formatNumber(d.dailyProfitLoss),
        formatNumber(d.grossProfit),
        formatNumber(d.commissionAmount),
        getPaymentStatusPersian(d.paymentStatus),
        d.paymentNotes || (d.isManualCommission ? `تغییر دستی: ${d.manualCommissionReason || ''}` : (d.dailyProfitLoss && d.dailyProfitLoss < 0 ? 'زیان روز: ۰.۲۵٪ نرخ فروش' : ''))
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 22 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, catName);

    const sanitizedTitle = (periodTitle || 'Period').replace(/[/\\?%*:|"<> ]/g, '_');
    const fileName = `${catName}_${sanitizedTitle}.xlsx`;

    XLSX.writeFile(wb, fileName);
}
