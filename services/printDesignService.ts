import type { DocumentPaperSize } from '../types/bankLetter';
import type {
    DocumentPrintDesignSettings,
    PrintDesignVariant
} from '../types/printDesign';

const STORAGE_KEY_PREFIX = 'hk_print_design_settings_v1_';

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
            footerLeftText: '{{DOC_TITLE}} | قرارداد: {{DOC_NUMBER}}'
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
        footerLeftText: '{{DOC_TITLE}} — شماره: {{DOC_NUMBER}} | تاریخ: {{DOC_DATE}}'
    };
};

export const loadPrintDesign = (
    variant: PrintDesignVariant,
    paperSize: DocumentPaperSize = 'A4'
): DocumentPrintDesignSettings => {
    const defaults = getDefaultPrintDesign(variant, paperSize);
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${variant}`);
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
