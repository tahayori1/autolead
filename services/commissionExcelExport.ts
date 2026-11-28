import * as XLSX from 'xlsx';
import { CommissionDeal, CommissionPeriod, CommissionCategory, CarYardItem, CommissionSettings } from '../types';
import {
    buildPersonnelFinalAndPayoutSummary,
    formatDecimalPercentLabel,
    getCommissionSettings,
    getDealParticipantInfo,
    isDealEligibleForConfirmedTotals
} from './commissionService';

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
    yardItems = [],
    settings: customSettings
}: {
    deals: CommissionDeal[];
    periods: CommissionPeriod[];
    activePeriodId?: string;
    yardItems?: CarYardItem[];
    settings?: CommissionSettings;
}): void {
    const wb = XLSX.utils.book_new();
    const settings = customSettings || getCommissionSettings();

    const targetPeriod = periods.find(p => p.id === activePeriodId);
    const activeDeals = activePeriodId ? deals.filter(d => d.periodId === activePeriodId) : deals;
    const periodTitle = targetPeriod?.title || (periods.length > 0 ? periods.map(p => p.title).join(' - ') : 'کلیه دوره‌ها');

    const summary = buildPersonnelFinalAndPayoutSummary(activeDeals, targetPeriod, settings);

    // ----------------------------------------------------
    // 1. Sheet 1: خلاصه مدیریتی و شاخص‌های مالی
    // ----------------------------------------------------
    let totalSales = 0;
    let totalPurchase = 0;
    let totalGrossProfit = 0;
    let totalDailyProfitLoss = 0;
    let totalCommissionConfirmed = 0;
    let totalPaidCommission = 0;

    activeDeals.forEach(d => {
        totalSales += (d.salePrice || d.downPayment || 0);
        totalPurchase += (d.purchasePrice || 0);
        totalGrossProfit += (d.grossProfit || 0);
        totalDailyProfitLoss += (d.dailyProfitLoss || 0);
        const elig = isDealEligibleForConfirmedTotals(d, settings);
        if (elig.eligible) {
            totalCommissionConfirmed += (d.commissionAmount || 0);
            if (d.paymentStatus === 'PAID') {
                totalPaidCommission += d.paidCommissionShare ?? d.commissionAmount;
            } else if (d.paymentStatus === 'PARTIAL') {
                totalPaidCommission += d.paidCommissionShare ?? 0;
            }
        }
    });

    const pendingCommission = Math.max(0, totalCommissionConfirmed - totalPaidCommission);
    const payoutPct = totalCommissionConfirmed > 0 ? ((totalPaidCommission / totalCommissionConfirmed) * 100).toFixed(1) + '%' : '0%';

    const summaryData: any[][] = [
        ['گزارش جامع پورسانت و کارانه معاملات خودرویی - هلدینگ حسینی خودرو'],
        ['دوره مالی:', periodTitle],
        ['تاریخ صدور گزارش:', new Date().toLocaleDateString('fa-IR')],
        [''],
        ['شاخص مالی کل', 'مبلغ (ریال)', 'مبلغ (تومان)', 'توضیحات'],
        ['تعداد کل معاملات ثبت‌شده', activeDeals.length, '-', `${activeDeals.length} فقره قرارداد`],
        ['مجموع حجم فروش و پیش‌پرداخت‌ها', formatNumber(totalSales), formatNumber(totalSales / 10), 'گردش مالی حاصل از فروش'],
        ['مجموع نرخ خرید خودروها', formatNumber(totalPurchase), formatNumber(totalPurchase / 10), 'بهای تمام‌شده خرید خودروها'],
        ['سود ناخالص کل', formatNumber(totalGrossProfit), formatNumber(totalGrossProfit / 10), 'اختلاف نرخ فروش و نرخ خرید'],
        ['کل پورسانت قطعی بخش‌ها', formatNumber(totalCommissionConfirmed), formatNumber(totalCommissionConfirmed / 10), 'بدون احتساب ردیف‌های پرچم‌دار تأییدنشده و لیزینگ پیش‌نویس'],
        ['جمع نهایی شیت «نهایی» (پس از تعدیل‌ها)', formatNumber(summary.totals.totalFinalCommission), formatNumber(summary.totals.totalFinalCommission / 10), 'مجموع خالص پورسانت پرسنل'],
        ['جمع نهایی شیت «پرداختی»', formatNumber(summary.totals.totalFinalPayable), formatNumber(summary.totals.totalFinalPayable / 10), settings.payoutHoldMode === 'ADD' ? 'با احتساب +۱۰٪' : 'پس از کسر ۱۰٪ و اعمال اضافات پرداختی'],
        ['پورسانت‌های تسویه‌شده و واریزی', formatNumber(totalPaidCommission), formatNumber(totalPaidCommission / 10), 'مبالغ پرداخت‌شده به مشاوران'],
        ['مانده در انتظار تسویه', formatNumber(pendingCommission), formatNumber(pendingCommission / 10), `تحقق تسویه: ${payoutPct}`],
        ['کارانه کلی (جمع نهایی پورسانت‌های آزاد)', formatNumber(summary.karaneh.totalAzadFinalCommission), formatNumber(summary.karaneh.totalAzadFinalCommission / 10), `تقسیم بر ${summary.karaneh.sectionCount} بخش = ${formatNumber(summary.karaneh.perSectionKaraneh).toLocaleString('fa-IR')} ریال هر بخش`],
        ['تعداد ردیف‌های لیزینگ پیش‌نویس', summary.totals.draftLeasingCount, '-', settings.leasingRateConfirmed ? `نرخ مصوب: ${formatDecimalPercentLabel(settings.leasingRate)}` : 'نرخ لیزینگ هنوز تعیین/تأیید نشده است'],
        ['تعداد ردیف‌های دارای نرخ خرید غیرواقعی (در انتظار تأیید)', summary.totals.flaggedUnrealisticCount, '-', 'ردیف‌های پرچم‌دار تا تأیید مدیر در جمع لحاظ نمی‌شوند'],
        [''],
        ['تفکیک عملکرد بر اساس شیت و دسته‌بندی معامله:'],
        ['دسته‌بندی', 'تعداد معامله', 'حجم فروش (ریال)', 'سود ناخالص (ریال)', 'سود/زیان (ریال)', 'پورسانت قطعی (ریال)', 'فرمول و نرخ محاسبه']
    ];

    const categories: CommissionCategory[] = ['ANBAR', 'AZAD', 'HAVALEH', 'LEASING', 'REGISTRATION'];
    categories.forEach(cat => {
        const catDeals = activeDeals.filter(d => d.category === cat);
        const catSales = catDeals.reduce((sum, d) => sum + (d.salePrice || d.downPayment || 0), 0);
        const catGross = catDeals.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
        const catDaily = catDeals.reduce((sum, d) => sum + (d.dailyProfitLoss || 0), 0);
        const catComm = catDeals.reduce((sum, d) => {
            const elig = isDealEligibleForConfirmedTotals(d, settings);
            return sum + (elig.eligible ? (d.commissionAmount || 0) : 0);
        }, 0);

        let rateDesc = '';
        if (cat === 'ANBAR') rateDesc = `MAX(0, فروش - قیمت روز) × ${formatDecimalPercentLabel(settings.anbarRate)} + ${formatNumber(settings.anbarIncentiveBonus).toLocaleString('fa-IR')} ریال تشویقی`;
        else if (cat === 'AZAD') rateDesc = `MAX(0, سود) × ${formatDecimalPercentLabel(settings.azadRate)} (${formatDecimalPercentLabel(settings.azadHardRate)} معاملات سخت) ÷ تعداد پرسنل`;
        else if (cat === 'HAVALEH') rateDesc = `MAX(0, فروش - قیمت روز) × ${formatDecimalPercentLabel(settings.havalehRate)} ÷ تعداد پرسنل`;
        else if (cat === 'LEASING') rateDesc = settings.leasingRateConfirmed ? `${formatDecimalPercentLabel(settings.leasingRate)} پیش‌پرداخت` : 'پیش‌نویس (نیازمند تعیین نرخ توسط مدیر)';
        else if (cat === 'REGISTRATION') rateDesc = `${formatDecimalPercentLabel(settings.registrationRate)} پیش‌پرداخت`;

        summaryData.push([
            getCategoryPersianName(cat),
            catDeals.length,
            formatNumber(catSales),
            formatNumber(catGross),
            formatNumber(catDaily),
            formatNumber(catComm),
            rateDesc
        ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 22 }, { wch: 38 }, { wch: 22 }, { wch: 22 }, { wch: 44 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'خلاصه مدیریتی');

    // ----------------------------------------------------
    // 2. Sheet 2: فروش انبار (ANBAR)
    // ----------------------------------------------------
    const anbarDeals = activeDeals.filter(d => d.category === 'ANBAR');
    const anbarHeaders = [
        'ردیف', 'شناسه معامله', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس', 'خریدار / مشتری',
        'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'نرخ فروش (ریال)',
        'سود یا زیان روز (ریال)', 'درصد پورسانت', 'پورسانت قدیم (ریال)', 'پورسانت تشویقی (ریال)', 'پورسانت نهایی (ریال)',
        'وضعیت واریز', 'توضیحات'
    ];
    const anbarRows = anbarDeals.map((d, i) => [
        i + 1,
        d.transactionId || '',
        d.purchaseDate || '',
        d.saleDate || '',
        d.salesPerson || '',
        d.contractWriter || '',
        d.customerName || d.buyerName || '',
        d.carModel || '',
        formatNumber(d.purchasePrice),
        formatNumber(d.dailyPrice),
        formatNumber(d.salePrice),
        formatNumber(d.dailyProfitLoss ?? ((d.salePrice || 0) - (d.purchasePrice || 0))),
        d.isManualCommission ? 'دستی' : formatDecimalPercentLabel(d.commissionRate ?? settings.anbarRate),
        formatNumber(d.oldCommissionAmount),
        formatNumber(d.incentiveBonusAmount ?? settings.anbarIncentiveBonus),
        formatNumber(d.commissionAmount),
        getPaymentStatusPersian(d.paymentStatus),
        d.paymentNotes || ''
    ]);
    const anbarWs = XLSX.utils.aoa_to_sheet([anbarHeaders, ...anbarRows]);
    anbarWs['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 22 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
        { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, anbarWs, 'فروش انبار');

    // ----------------------------------------------------
    // 3. Sheet 3: فروش آزاد (AZAD)
    // ----------------------------------------------------
    const azadDeals = activeDeals.filter(d => d.category === 'AZAD');
    const azadHeaders = [
        'ردیف', 'شناسه معامله', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'تعداد مشارکت‌کننده', 'فروشنده', 'خریدار',
        'مدل خودرو', 'نرخ خرید (ریال)', 'نرخ فروش (ریال)',
        'سود معامله (ریال)', 'نوع معامله / نرخ', 'پورسانت کل معامله (ریال)', 'پورسانت نهایی هر نفر (ریال)',
        'پورسانت ۱۰ درصدی (ریال)', 'پرچم نرخ خرید', 'وضعیت واریز', 'توضیحات'
    ];
    const azadRows = azadDeals.map((d, i) => {
        const partInfo = getDealParticipantInfo(d, activeDeals);
        return [
            i + 1,
            d.transactionId || '',
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            partInfo.participantCount,
            d.sellerName || '',
            d.buyerName || d.customerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.salePrice),
            formatNumber(d.grossProfit),
            d.isManualCommission ? 'دستی' : (d.isHardDeal ? `معاملات سخت (${formatDecimalPercentLabel(settings.azadHardRate)})` : `عادی (${formatDecimalPercentLabel(settings.azadRate)})`),
            formatNumber(d.commissionAmount),
            formatNumber(d.perPersonCommission ?? Math.round((d.commissionAmount || 0) / partInfo.participantCount)),
            formatNumber(d.tenPercentCommission ?? Math.round((d.perPersonCommission ?? ((d.commissionAmount || 0) / partInfo.participantCount)) * 0.10)),
            d.isUnrealisticPurchasePrice ? (d.managerApprovedUnrealistic ? 'تأیید مدیر' : 'نرخ غیرواقعی (حذف از جمع)') : 'معتبر',
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || ''
        ];
    });
    const azadWs = XLSX.utils.aoa_to_sheet([azadHeaders, ...azadRows]);
    azadWs['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
        { wch: 16 }, { wch: 16 }, { wch: 16 },
        { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 },
        { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, azadWs, 'فروش آزاد');

    // ----------------------------------------------------
    // 4. Sheet 4: فروش حواله (HAVALEH)
    // ----------------------------------------------------
    const havalehDeals = activeDeals.filter(d => d.category === 'HAVALEH');
    const havalehHeaders = [
        'ردیف', 'شناسه معامله', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'تعداد پرسنل', 'خریدار',
        'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'مبلغ سبد بعدی (اطلاعاتی)', 'نرخ فروش (ریال)',
        'سود و زیان (ریال)', 'درصد پورسانت', 'پورسانت کل (ریال)', 'پورسانت نهایی هر نفر (ریال)',
        'وضعیت واریز', 'توضیحات'
    ];
    const havalehRows = havalehDeals.map((d, i) => {
        const partInfo = getDealParticipantInfo(d, activeDeals);
        return [
            i + 1,
            d.transactionId || '',
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            partInfo.participantCount,
            d.customerName || d.buyerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.dailyPrice),
            formatNumber(d.nextBasketAmount),
            formatNumber(d.salePrice),
            formatNumber(d.dailyProfitLoss),
            d.isManualCommission ? 'دستی' : formatDecimalPercentLabel(d.commissionRate ?? settings.havalehRate),
            formatNumber(d.commissionAmount),
            formatNumber(d.perPersonCommission ?? Math.round((d.commissionAmount || 0) / partInfo.participantCount)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || ''
        ];
    });
    const havalehWs = XLSX.utils.aoa_to_sheet([havalehHeaders, ...havalehRows]);
    havalehWs['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 20 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
        { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
        { wch: 18 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, havalehWs, 'فروش حواله');

    // ----------------------------------------------------
    // 5. Sheet 5: ثبت نام (REGISTRATION)
    // ----------------------------------------------------
    const regDeals = activeDeals.filter(d => d.category === 'REGISTRATION');
    const regHeaders = [
        'ردیف', 'شناسه معامله', 'تاریخ ثبت‌نام', 'شماره قرارداد', 'پرسنل فروش', 'نام متقاضی',
        'مدل خودرو', 'پیش‌پرداخت (ریال)', 'درصد پورسانت', 'پورسانت کل (ریال)', 'سهم هر نفر (ریال)',
        'وضعیت واریز', 'توضیحات'
    ];
    const regRows = regDeals.map((d, i) => {
        const partInfo = getDealParticipantInfo(d, activeDeals);
        return [
            i + 1,
            d.transactionId || '',
            d.saleDate || '',
            d.contractNumber || '',
            d.salesPerson || '',
            d.customerName || '',
            d.carModel || '',
            formatNumber(d.downPayment),
            d.isManualCommission ? 'دستی' : formatDecimalPercentLabel(d.commissionRate ?? settings.registrationRate),
            formatNumber(d.commissionAmount),
            formatNumber(d.perPersonCommission ?? Math.round((d.commissionAmount || 0) / partInfo.participantCount)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || ''
        ];
    });
    const regWs = XLSX.utils.aoa_to_sheet([regHeaders, ...regRows]);
    regWs['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 22 },
        { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, regWs, 'ثبت نام');

    // ----------------------------------------------------
    // 6. Sheet 6: لیزینگ (LEASING)
    // ----------------------------------------------------
    const leasingDeals = activeDeals.filter(d => d.category === 'LEASING');
    const leasingHeaders = [
        'ردیف', 'شناسه معامله', 'تاریخ فروش', 'پرسنل فروش', 'نام مشتری',
        'مدل خودرو', 'مبلغ پیش‌پرداخت (ریال)', 'نرخ لیزینگ', 'پورسانت محاسبه‌شده (ریال)',
        'وضعیت تایید نرخ', 'وضعیت واریز', 'توضیحات'
    ];
    const leasingRows = leasingDeals.map((d, i) => [
        i + 1,
        d.transactionId || '',
        d.saleDate || '',
        d.salesPerson || '',
        d.customerName || d.buyerName || '',
        d.carModel || '',
        formatNumber(d.downPayment),
        settings.leasingRateConfirmed ? formatDecimalPercentLabel(settings.leasingRate) : 'نامشخص',
        formatNumber(d.commissionAmount),
        settings.leasingRateConfirmed ? 'تایید شده (قطعی)' : 'پیش‌نویس (حذف از جمع نهایی)',
        getPaymentStatusPersian(d.paymentStatus),
        d.paymentNotes || ''
    ]);
    const leasingWs = XLSX.utils.aoa_to_sheet([leasingHeaders, ...leasingRows]);
    leasingWs['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
        { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
        { wch: 24 }, { wch: 16 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, leasingWs, 'لیزینگ');

    // ----------------------------------------------------
    // 7. Sheet 7: نهایی (Personnel Aggregation & Rank)
    // ----------------------------------------------------
    const finalHeaders = [
        'رتبه', 'نام پرسنل (نرمال‌شده)', 'فروش انبار (ریال)', 'فروش آزاد (ریال)', 'فروش حواله (ریال)',
        'ثبت نام (ریال)', 'لیزینگ (ریال)', 'جمع پورسانت (ریال)',
        'هدیه (ریال)', 'مراسم (ریال)', 'پاداش (ریال)', 'کسورات (ریال)', 'مجموع تعدیل‌ها (ریال)',
        'نهایی (ریال)', 'پرداخت‌شده (ریال)', 'مانده (ریال)', 'توضیحات'
    ];
    const finalSheetRows = summary.finalRows.map(r => [
        r.rank,
        r.staffName,
        formatNumber(r.anbarCommission),
        formatNumber(r.azadCommission),
        formatNumber(r.havalehCommission),
        formatNumber(r.registrationCommission),
        formatNumber(r.leasingCommission),
        formatNumber(r.totalSheetCommission),
        formatNumber(r.giftAdjustment),
        formatNumber(r.ceremonyAdjustment),
        formatNumber(r.bonusAdjustment),
        formatNumber(r.deductionsAdjustment),
        formatNumber(r.netAdjustmentTotal),
        formatNumber(r.finalCommission),
        formatNumber(r.paidAmount),
        formatNumber(r.remainingAmount),
        r.notes || ''
    ]);
    finalSheetRows.push([
        '',
        'جمع کل',
        formatNumber(summary.totals.anbar),
        formatNumber(summary.totals.azad),
        formatNumber(summary.totals.havaleh),
        formatNumber(summary.totals.registration),
        formatNumber(summary.totals.leasing),
        formatNumber(summary.totals.totalSheetCommission),
        '', '', '', '',
        formatNumber(summary.totals.totalAdjustments),
        formatNumber(summary.totals.totalFinalCommission),
        '', '', ''
    ] as any);

    const finalWs = XLSX.utils.aoa_to_sheet([finalHeaders, ...finalSheetRows]);
    finalWs['!cols'] = [
        { wch: 6 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
        { wch: 16 }, { wch: 16 }, { wch: 18 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
        { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, finalWs, 'نهایی');

    // ----------------------------------------------------
    // 8. Sheet 8: پرداختی ماهانه (Monthly Payout)
    // ----------------------------------------------------
    const holdLabel = settings.payoutHoldMode === 'ADD' ? 'اضافه ۱۰٪ کمسیون نهایی' : 'کسر ۱۰٪ کمسیون نهایی';
    const payoutHeaders = [
        'رتبه', 'نام پرسنل', 'کمسیون نهایی (از شیت نهایی)', 'هدیه', 'کمسیون T9', 'مراسم',
        'آپشن', 'ثبت‌نام معوقه', 'سایر اضافات', holdLabel, 'نهایی پرداختی (ریال)', 'یادداشت'
    ];
    const payoutSheetRows = summary.payoutRows.map(p => [
        p.rank,
        p.staffName,
        formatNumber(p.finalCommissionFromNahayi),
        formatNumber(p.gift),
        formatNumber(p.t9Backlog),
        formatNumber(p.ceremony),
        formatNumber(p.optionCommission),
        formatNumber(p.lateRegistration),
        formatNumber(p.otherExtras),
        formatNumber(p.tenPercentHold),
        formatNumber(p.finalPayable),
        p.notes || ''
    ]);
    payoutSheetRows.push([
        '',
        'جمع کل پرداختی',
        formatNumber(summary.totals.totalFinalCommission),
        '', '', '', '', '',
        formatNumber(summary.totals.totalExtras),
        formatNumber(summary.totals.totalTenPercentHold),
        formatNumber(summary.totals.totalFinalPayable),
        ''
    ] as any);
    const payoutWs = XLSX.utils.aoa_to_sheet([payoutHeaders, ...payoutSheetRows]);
    payoutWs['!cols'] = [
        { wch: 6 }, { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
        { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, payoutWs, 'پرداختی');

    // ----------------------------------------------------
    // 9. Sheet 9: سهام کارانه (Karaneh Shares)
    // ----------------------------------------------------
    const karanehData: any[][] = [
        ['محاسبه کارانه کلی، کارانه هر بخش و جدول سهام کارانه'],
        ['کارانه کلی (جمع نهایی پورسانت‌های فروش آزاد)', formatNumber(summary.karaneh.totalAzadFinalCommission), 'ریال'],
        ['تعداد بخش‌های کارانه', summary.karaneh.sectionCount, 'بخش'],
        ['کارانه هر بخش (کارانه کلی ÷ تعداد بخش)', formatNumber(summary.karaneh.perSectionKaraneh), 'ریال'],
        [''],
        ['ردیف', 'دریافت‌کننده سهم کارانه', 'روش محاسبه', 'درصد / مبلغ ثابت', 'سهم محاسبه‌شده (ریال)']
    ];
    summary.karaneh.recipientShares.forEach((s, idx) => {
        karanehData.push([
            idx + 1,
            s.recipientName,
            s.mode === 'FIXED' ? 'مبلغ ثابت' : 'درصد از کارانه هر بخش',
            s.mode === 'FIXED' ? formatNumber(s.fixedAmount) : formatDecimalPercentLabel(s.percent),
            formatNumber(s.calculatedAmount)
        ]);
    });
    karanehData.push(['', 'جمع کل سهام توزیع‌شده', '', '', formatNumber(summary.karaneh.totalDistributedShares)]);

    const karanehWs = XLSX.utils.aoa_to_sheet(karanehData);
    karanehWs['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, karanehWs, 'سهام کارانه');

    // ----------------------------------------------------
    // 10. Sheet 10: کاردکس انبار خودرو (اختیاری)
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

    const sanitizedTitle = (periodTitle || 'Commission_Report').replace(/[/\\?%*:|"<> ]/g, '_');
    const fileName = `گزارش_جامع_پورسانت_${sanitizedTitle}.xlsx`;
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
        'ردیف', 'شناسه معامله', 'تاریخ خرید', 'تاریخ فروش', 'پرسنل فروش', 'قولنامه‌نویس', 'خریدار / مشتری',
        'مدل خودرو', 'نرخ خرید (ریال)', 'قیمت روز (ریال)', 'نرخ فروش / پیش‌پرداخت (ریال)',
        'سود/زیان (ریال)', 'پورسانت قدیم (ریال)', 'تشویقی (ریال)', 'پورسانت کل (ریال)', 'سهم هر نفر (ریال)',
        'وضعیت واریز', 'توضیحات'
    ];

    const rows = catDeals.map((d, i) => {
        const partInfo = getDealParticipantInfo(d, deals);
        return [
            i + 1,
            d.transactionId || '',
            d.purchaseDate || '',
            d.saleDate || '',
            d.salesPerson || '',
            d.contractWriter || '',
            d.customerName || d.buyerName || '',
            d.carModel || '',
            formatNumber(d.purchasePrice),
            formatNumber(d.dailyPrice),
            formatNumber(d.salePrice || d.downPayment),
            formatNumber(d.grossProfit ?? d.dailyProfitLoss),
            formatNumber(d.oldCommissionAmount),
            formatNumber(d.incentiveBonusAmount),
            formatNumber(d.commissionAmount),
            formatNumber(d.perPersonCommission ?? Math.round((d.commissionAmount || 0) / partInfo.participantCount)),
            getPaymentStatusPersian(d.paymentStatus),
            d.paymentNotes || ''
        ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 22 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
        { wch: 18 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, catName);

    const sanitizedTitle = (periodTitle || 'Period').replace(/[/\\?%*:|"<> ]/g, '_');
    const fileName = `${catName}_${sanitizedTitle}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
