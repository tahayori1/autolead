import type { DocumentPaperSize } from '../types/bankLetter';
import type {
    DocumentPrintDesignSettings,
    PrintDesignVariant
} from '../types/printDesign';

const STORAGE_KEY_PREFIX = 'hk_print_design_settings_v2_';

export const getDefaultPrintDesign = (
    variant: PrintDesignVariant,
    paperSize: DocumentPaperSize = 'A4'
): DocumentPrintDesignSettings => {
    const isA5 = paperSize === 'A5';

    if (variant === 'leasing') {
        return {
            bodyFontSizePt: isA5 ? 8.9 : 10.1,
            bodyLineHeight: isA5 ? 1.74 : 1.86,
            showHeader: true,
            headerFontSizePt: isA5 ? 8 : 9,
            headerTitleFontSizePt: isA5 ? 10.5 : 13,
            headerPaddingPx: 6,
            headerBadgeText: 'KMC',
            headerCompanyName: 'شرکت واسپاری کرمان موتور',
            headerCompanySub: 'نمایندگی ۲۶۰۶ حسینی خودرو شیراز',
            headerExtraLine: 'تلفن نمایندگی: ۰۷۱۹۱۶۹۰۹۰۶',
            headerBasmala: '',
            headerCustomTitle: '',
            headerCustomSubtitle: '',
            showFooter: true,
            footerFontSizePt: isA5 ? 6.8 : 7.7,
            footerPaddingPx: 5,
            showPageNumbers: true,
            footerRightText:
                'شرکت واسپاری کرمان موتور — نمایندگی ۲۶۰۶ حسینی خودرو شیراز (تلفن: ۰۷۱۹۱۶۹۰۹۰۶)',
            footerLeftText: '{{DOC_TITLE}} | قرارداد: {{DOC_NUMBER}}',
            showWatermark: true,
            watermarkText: 'KERMAN MOTOR LEASING',
            watermarkSubText: 'HOSEINI KHODRO 2606',
            watermarkFontSizePt: isA5 ? 24 : 36,
            watermarkOpacity: 0.035,
            watermarkAngleDeg: -18
        };
    }

    return {
        bodyFontSizePt: isA5 ? 10 : 11.2,
        bodyLineHeight: isA5 ? 1.85 : 2.02,
        showHeader: true,
        headerFontSizePt: isA5 ? 8 : 9,
        headerTitleFontSizePt: isA5 ? 12.5 : 15.5,
        headerPaddingPx: isA5 ? 8 : 10,
        headerBadgeText: '۲۶۰۶',
        headerCompanyName: 'شرکت تضامنی حسینی خودرو شیراز',
        headerCompanySub: 'نمایندگی رسمی کرمان موتور - کد ۲۶۰۶',
        headerExtraLine: 'تلفن: ۰۷۱۹۱۶۹۰۹۰۶',
        headerBasmala: '',
        headerCustomTitle: '',
        headerCustomSubtitle: '',
        showFooter: true,
        footerFontSizePt: isA5 ? 7.2 : 8,
        footerPaddingPx: 7,
        showPageNumbers: true,
        footerRightText:
            'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو) | تلفن: ۰۷۱۹۱۶۹۰۹۰۶',
        footerLeftText: '{{DOC_TITLE}} — شماره: {{DOC_NUMBER}} | تاریخ: {{DOC_DATE}}',
        showWatermark: true,
        watermarkText: 'HOSEINI KHODRO',
        watermarkSubText: 'KERMAN MOTOR 2606',
        watermarkFontSizePt: isA5 ? 26 : 38,
        watermarkOpacity: 0.035,
        watermarkAngleDeg: -18
    };
};

export interface PrintPresetMeta {
    id: string;
    label: string;
    category: 'typography' | 'header_footer' | 'watermark';
    description: string;
    apply: (
        current: DocumentPrintDesignSettings,
        variant: PrintDesignVariant,
        paperSize: DocumentPaperSize
    ) => DocumentPrintDesignSettings;
}

export const PRINT_DESIGN_PRESETS: PrintPresetMeta[] = [
    {
        id: 'typo_compact',
        label: 'فشرده (صرفه‌جویی صفحه)',
        category: 'typography',
        description: 'فونت جمع‌وجور و فاصله خط کمتر برای جایگیری در صفحات کمتر',
        apply: (current, variant) => ({
            ...current,
            bodyFontSizePt: variant === 'leasing' ? 8.6 : 9.4,
            bodyLineHeight: 1.62,
            headerFontSizePt: 7.5,
            headerTitleFontSizePt: variant === 'leasing' ? 10.5 : 12,
            headerPaddingPx: 4,
            footerFontSizePt: 6.8,
            footerPaddingPx: 4
        })
    },
    {
        id: 'typo_standard',
        label: 'استاندارد رسمی',
        category: 'typography',
        description: 'تنظیمات استاندارد و متعادل بر اساس قطع کاغذ انتخاب‌شده',
        apply: (current, variant, paperSize) => {
            const base = getDefaultPrintDesign(variant, paperSize);
            return {
                ...current,
                bodyFontSizePt: base.bodyFontSizePt,
                bodyLineHeight: base.bodyLineHeight,
                headerFontSizePt: base.headerFontSizePt,
                headerTitleFontSizePt: base.headerTitleFontSizePt,
                headerPaddingPx: base.headerPaddingPx,
                footerFontSizePt: base.footerFontSizePt,
                footerPaddingPx: base.footerPaddingPx
            };
        }
    },
    {
        id: 'typo_large',
        label: 'درشت و خوانا',
        category: 'typography',
        description: 'متن بزرگ‌تر و فاصله خطوط بازتر جهت مطالعه راحت مشتری',
        apply: (current, variant) => ({
            ...current,
            bodyFontSizePt: variant === 'leasing' ? 11.4 : 12.6,
            bodyLineHeight: 2.25,
            headerFontSizePt: 10,
            headerTitleFontSizePt: variant === 'leasing' ? 14.5 : 17,
            headerPaddingPx: 11,
            footerFontSizePt: 8.8,
            footerPaddingPx: 8
        })
    },
    {
        id: 'typo_executive',
        label: 'نامه اداری باوقار',
        category: 'typography',
        description: 'تیتر درشت، فاصله خطوط کشیده و ظاهر مجلسی برای نامه‌های بانکی',
        apply: (current, variant) => ({
            ...current,
            bodyFontSizePt: variant === 'leasing' ? 10.8 : 11.8,
            bodyLineHeight: 2.35,
            headerFontSizePt: 9.5,
            headerTitleFontSizePt: variant === 'leasing' ? 14 : 16.5,
            headerPaddingPx: 12,
            footerFontSizePt: 8,
            footerPaddingPx: 7
        })
    },
    {
        id: 'hf_full_agency',
        label: 'سربرگ و پاورقی کامل نمایندگی',
        category: 'header_footer',
        description: 'نمایش کامل مشخصات نمایندگی ۲۶۰۶، تلفن، تاریخ، شماره و صفحه',
        apply: (current, variant, paperSize) => {
            const base = getDefaultPrintDesign(variant, paperSize);
            return {
                ...current,
                showHeader: true,
                showFooter: true,
                showPageNumbers: true,
                headerBadgeText: base.headerBadgeText,
                headerCompanyName: base.headerCompanyName,
                headerCompanySub: base.headerCompanySub,
                headerExtraLine: base.headerExtraLine,
                headerBasmala: '',
                headerCustomTitle: '',
                headerCustomSubtitle: '',
                footerRightText: base.footerRightText,
                footerLeftText: base.footerLeftText
            };
        }
    },
    {
        id: 'hf_minimal',
        label: 'سربرگ مینیمال و خلاصه',
        category: 'header_footer',
        description: 'سربرگ سبک بدون خط اضافه و پاورقی کوتاه با شماره صفحه',
        apply: (current, variant) => ({
            ...current,
            showHeader: true,
            showFooter: true,
            showPageNumbers: true,
            headerFontSizePt: 8,
            headerTitleFontSizePt: variant === 'leasing' ? 11.5 : 13.5,
            headerPaddingPx: 5,
            headerExtraLine: '',
            footerFontSizePt: 7,
            footerPaddingPx: 4,
            footerRightText:
                variant === 'leasing'
                    ? 'شرکت واسپاری کرمان موتور — کد ۲۶۰۶'
                    : 'حسینی خودرو شیراز — کد ۲۶۰۶',
            footerLeftText: 'شماره: {{DOC_NUMBER}}'
        })
    },
    {
        id: 'hf_preprinted_paper',
        label: 'چاپ روی کاغذ سربرگ‌دار (بدون هدر/فوتر)',
        category: 'header_footer',
        description: 'حذف هدر و فوتر نرم‌افزاری هنگام چاپ روی سربرگ کاغذی آماده',
        apply: (current) => ({
            ...current,
            showHeader: false,
            showFooter: false,
            showWatermark: false
        })
    },
    {
        id: 'hf_no_page_num',
        label: 'بدون شماره‌گذاری صفحه',
        category: 'header_footer',
        description: 'نمایش هدر و متن پاورقی بدون برچسب «صفحه X از Y»',
        apply: (current) => ({
            ...current,
            showHeader: true,
            showFooter: true,
            showPageNumbers: false
        })
    },
    {
        id: 'wm_copy_equal',
        label: 'واترمارک «رونوشت / بایگانی»',
        category: 'watermark',
        description: 'تنظیم واترمارک فارسی برای نسخه‌های بایگانی و رونوشت مشتری',
        apply: (current) => ({
            ...current,
            showWatermark: true,
            watermarkText: 'نسخه بایگانی نمایندگی ۲۶۰۶',
            watermarkSubText: 'حسینی خودرو شیراز — فاقد اعتبار بدون مهر برجسته',
            watermarkFontSizePt: 26,
            watermarkOpacity: 0.07,
            watermarkAngleDeg: -22
        })
    },
    {
        id: 'wm_draft',
        label: 'واترمارک «پیش‌نویس غیررسمی»',
        category: 'watermark',
        description: 'نشانگر واضح پیش‌نویس برای بررسی مشتری قبل از تایید نهایی',
        apply: (current) => ({
            ...current,
            showWatermark: true,
            watermarkText: 'پیش‌نویس — DRAFT',
            watermarkSubText: 'صرفاً جهت بررسی و تطبیق اطلاعات',
            watermarkFontSizePt: 34,
            watermarkOpacity: 0.08,
            watermarkAngleDeg: -20
        })
    }
];

export const loadPrintDesign = (
    variant: PrintDesignVariant,
    paperSize: DocumentPaperSize = 'A4'
): DocumentPrintDesignSettings => {
    const defaults = getDefaultPrintDesign(variant, paperSize);
    try {
        const raw =
            localStorage.getItem(`${STORAGE_KEY_PREFIX}${variant}`) ||
            localStorage.getItem(`hk_print_design_settings_v1_${variant}`);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw) as Partial<DocumentPrintDesignSettings>;
        return {
            ...defaults,
            ...parsed
        };
    } catch {
        return defaults;
    }
};

export const savePrintDesign = (
    variant: PrintDesignVariant,
    settings: DocumentPrintDesignSettings
): void => {
    try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${variant}`, JSON.stringify(settings));
    } catch {
        // ignore storage quota errors
    }
};

export const resetPrintDesign = (
    variant: PrintDesignVariant,
    paperSize: DocumentPaperSize = 'A4'
): DocumentPrintDesignSettings => {
    const defaults = getDefaultPrintDesign(variant, paperSize);
    savePrintDesign(variant, defaults);
    return defaults;
};

export const formatFooterTemplateText = (
    template: string,
    vars: { docTitle: string; docNumber: string; docDate: string }
): string => {
    return (template || '')
        .replace(/\{\{DOC_TITLE\}\}/g, vars.docTitle || '')
        .replace(/\{\{DOC_NUMBER\}\}/g, vars.docNumber || '-')
        .replace(/\{\{DOC_DATE\}\}/g, vars.docDate || '-');
};
