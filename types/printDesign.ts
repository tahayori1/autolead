export type PrintDesignVariant = 'official' | 'leasing';

export interface DocumentPrintDesignSettings {
    // Typography (Body)
    bodyFontSizePt: number;
    bodyLineHeight: number;

    // Header Sizes & Visibility
    showHeader: boolean;
    headerFontSizePt: number;
    headerTitleFontSizePt: number;
    headerPaddingPx: number;

    // Header Editable Texts
    headerBadgeText: string;
    headerCompanyName: string;
    headerCompanySub: string;
    headerExtraLine: string;
    headerBasmala: string; // Empty = use each form's default basmala
    headerCustomTitle: string; // Empty = use each form's own title
    headerCustomSubtitle: string; // Empty = use each form's own subtitle

    // Footer Sizes & Visibility
    showFooter: boolean;
    footerFontSizePt: number;
    footerPaddingPx: number;
    showPageNumbers: boolean;

    // Footer Editable Texts (supports {{DOC_TITLE}}, {{DOC_NUMBER}}, {{DOC_DATE}})
    footerRightText: string;
    footerLeftText: string;

    // Watermark Settings
    showWatermark: boolean;
    watermarkText: string;
    watermarkSubText: string;
    watermarkFontSizePt: number;
    watermarkOpacity: number;
    watermarkAngleDeg: number;
}
