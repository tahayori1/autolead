/**
 * Dedicated RTL HTML + CSS Official Document Builder
 * Generates self-contained, print-native Persian (dir="rtl", lang="fa") HTML5 + CSS3 documents
 * with Vazirmatn typography, crisp A4 / A5 @page layout, and clean multi-page pagination.
 */

import type {
    BankLetter,
    CarPeaceContract,
    PreContractForm,
    RemittanceApprovalForm,
    FreeBillOfSale,
    DocumentPaperSize
} from '../types/bankLetter';
import {
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from './bankLetterValidation';

export type OfficialDocPayload =
    | { type: 'PEACE_CONTRACT'; data: CarPeaceContract }
    | { type: 'BANK_LETTER'; data: BankLetter }
    | { type: 'PRE_CONTRACT'; data: PreContractForm }
    | { type: 'REMITTANCE_APPROVAL'; data: RemittanceApprovalForm }
    | { type: 'FREE_BILL_OF_SALE'; data: FreeBillOfSale };

export interface HtmlPrintBuildOptions {
    paperSize?: DocumentPaperSize;
    showWatermark?: boolean;
    forStandaloneDownload?: boolean;
}

const COMPANY_PHONE_PERSIAN = '۰۷۱۹۱۶۹۰۹۰۶';
const COMPANY_ADDRESS = 'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)';

function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function nl2brEscaped(value: string): string {
    return escapeHtml(value).replace(/\n/g, '<br />');
}

/**
 * Extracts active @font-face rules for Vazirmatn from host stylesheets (such as @fontsource/vazirmatn)
 * resolving relative asset URLs to absolute URLs so iframes and standalone HTML render identically.
 */
function collectVazirmatnFontCss(forStandaloneDownload = false): string {
    const faceRules: string[] = [];

    if (!forStandaloneDownload && typeof document !== 'undefined') {
        try {
            const origin = window.location.href;
            for (let i = 0; i < document.styleSheets.length; i++) {
                const sheet = document.styleSheets[i];
                try {
                    const rules = sheet.cssRules;
                    if (!rules) continue;
                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];
                        if (rule instanceof CSSFontFaceRule) {
                            let cssText = rule.cssText;
                            if (/vazirmatn/i.test(cssText)) {
                                // Resolve relative url(...) against stylesheet href or page origin
                                const base = sheet.href || origin;
                                cssText = cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_m, _q, relUrl) => {
                                    if (/^(data:|blob:|https?:)/i.test(relUrl)) {
                                        return `url("${relUrl}")`;
                                    }
                                    try {
                                        return `url("${new URL(relUrl, base).href}")`;
                                    } catch {
                                        return `url("${relUrl}")`;
                                    }
                                });
                                faceRules.push(cssText);
                            }
                        }
                    }
                } catch {
                    // Skip cross-origin sheets
                }
            }
        } catch {
            // Fallback to Google Fonts link below
        }
    }

    return `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        ${faceRules.length > 0 ? `<style id="local-vazirmatn-faces">\n${faceRules.join('\n')}\n</style>` : ''}
    `;
}

function buildDocumentCss(paperSize: DocumentPaperSize, showWatermark: boolean): string {
    const isA5 = paperSize === 'A5';
    const pageW = isA5 ? '148mm' : '210mm';
    const pageMinH = isA5 ? '210mm' : '297mm';
    const screenPad = isA5 ? '10mm 11mm 13mm 11mm' : '13mm 15mm 16mm 15mm';
    const printMargin = isA5 ? '8mm 9mm 12mm 9mm' : '11mm 13mm 14mm 13mm';
    const baseFont = isA5 ? '10.2pt' : '11.4pt';
    const lineHeight = isA5 ? '1.88' : '2.05';

    return `
    <style>
        @page {
            size: ${paperSize} portrait;
            margin: ${printMargin};
            @bottom-left {
                content: "صفحه " counter(page) " از " counter(pages);
                font-family: 'Vazirmatn', Tahoma, sans-serif;
                font-size: ${isA5 ? '7.5pt' : '8.5pt'};
                color: #64748b;
            }
            @bottom-right {
                content: "شرکت حسینی خودرو شیراز (نمایندگی ۲۶۰۶) — تلفن: ${COMPANY_PHONE_PERSIAN}";
                font-family: 'Vazirmatn', Tahoma, sans-serif;
                font-size: ${isA5 ? '7.5pt' : '8.5pt'};
                color: #64748b;
            }
        }

        *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        html {
            direction: rtl;
            lang: fa;
            font-family: 'Vazirmatn', Tahoma, system-ui, sans-serif;
            background: #e2e8f0;
            color: #0f172a;
        }

        body {
            margin: 0;
            padding: 18px 12px 32px;
            direction: rtl;
            unicode-bidi: embed;
            font-family: 'Vazirmatn', Tahoma, system-ui, sans-serif;
            font-size: ${baseFont};
            line-height: ${lineHeight};
            color: #0f172a;
            font-feature-settings: "tnum";
            -webkit-font-smoothing: antialiased;
        }

        .ltr {
            direction: ltr;
            unicode-bidi: embed;
            display: inline-block;
            font-variant-numeric: tabular-nums;
        }

        /* Screen sheet presentation */
        .sheet-wrapper {
            width: ${pageW};
            max-width: 100%;
            min-height: ${pageMinH};
            margin: 0 auto;
            background-color: #ffffff;
            background-image: linear-gradient(
                to bottom,
                transparent calc(${pageMinH} - 1px),
                rgba(217, 119, 6, 0.38) calc(${pageMinH} - 1px),
                rgba(217, 119, 6, 0.38) ${pageMinH}
            );
            background-size: 100% ${pageMinH};
            padding: ${screenPad};
            border-radius: 6px;
            box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(148, 163, 184, 0.45);
            position: relative;
        }

        .watermark-layer {
            display: ${showWatermark ? 'flex' : 'none'};
            position: fixed;
            inset: 0;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            user-select: none;
            z-index: 0;
            opacity: 0.035;
        }

        .watermark-text {
            transform: rotate(-18deg);
            text-align: center;
            font-weight: 900;
            color: #0f172a;
        }
        .watermark-text .wm-en { font-size: ${isA5 ? '28pt' : '40pt'}; letter-spacing: 3px; }
        .watermark-text .wm-sub { font-size: ${isA5 ? '13pt' : '18pt'}; margin-top: 4px; color: #334155; }

        .doc-content {
            position: relative;
            z-index: 1;
        }

        /* Header Letterhead */
        .doc-header {
            display: flex;
            align-items: stretch;
            justify-content: space-between;
            gap: ${isA5 ? '8px' : '14px'};
            border-bottom: 2.5px solid #1e3a8a;
            padding-bottom: ${isA5 ? '8px' : '11px'};
            margin-bottom: ${isA5 ? '10px' : '14px'};
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .brand-block {
            display: flex;
            align-items: center;
            gap: ${isA5 ? '7px' : '10px'};
            flex: 1 1 34%;
            text-align: right;
        }

        .brand-badge {
            width: ${isA5 ? '34px' : '44px'};
            height: ${isA5 ? '34px' : '44px'};
            border-radius: 10px;
            background: linear-gradient(135deg, #1d4ed8, #0f172a);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: ${isA5 ? '10pt' : '12.5pt'};
            flex-shrink: 0;
            border: 1.5px solid #dbeafe;
        }

        .brand-title {
            font-weight: 900;
            font-size: ${isA5 ? '9pt' : '10.5pt'};
            color: #0f172a;
            line-height: 1.35;
        }

        .brand-sub {
            font-weight: 700;
            font-size: ${isA5 ? '7.4pt' : '8.5pt'};
            color: #475569;
            margin-top: 2px;
        }

        .title-block {
            flex: 1 1 36%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .basmala {
            font-size: ${isA5 ? '8.5pt' : '10pt'};
            font-weight: 700;
            color: #334155;
            margin-bottom: 2px;
        }

        .doc-title {
            margin: 0;
            font-size: ${isA5 ? '12.5pt' : '15.5pt'};
            font-weight: 900;
            color: #0f172a;
            border-bottom: 2.5px solid #d97706;
            padding: 0 8px 3px;
            display: inline-block;
            line-height: 1.35;
        }
        .doc-title.theme-blue { border-bottom-color: #2563eb; }
        .doc-title.theme-violet { border-bottom-color: #7c3aed; }
        .doc-title.theme-emerald { border-bottom-color: #059669; }
        .doc-title.theme-teal { border-bottom-color: #0d9488; }

        .doc-subtitle {
            font-size: ${isA5 ? '7pt' : '8pt'};
            color: #64748b;
            font-weight: 600;
            margin-top: 3px;
        }

        .meta-block {
            flex: 1 1 30%;
            text-align: left;
            font-size: ${isA5 ? '7.8pt' : '8.8pt'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
            gap: 3px;
        }

        .meta-row {
            display: flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
        }
        .meta-label { color: #64748b; font-weight: 700; }
        .meta-val { color: #0f172a; font-weight: 800; font-variant-numeric: tabular-nums; }

        /* Cards & Sections */
        .party-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-right: 3.5px solid #1e3a8a;
            border-radius: 8px;
            padding: ${isA5 ? '7px 10px' : '9px 13px'};
            margin-bottom: ${isA5 ? '7px' : '10px'};
            text-align: justify;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .party-card.secondary {
            border-right-color: #0d9488;
        }

        .section-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: ${isA5 ? '8px 10px' : '10px 14px'};
            margin-bottom: ${isA5 ? '8px' : '11px'};
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .section-box.highlight-amber {
            background: #fffbeb;
            border-color: #fcd34d;
        }

        .section-box.highlight-blue {
            background: #f8fafc;
            border: 1.5px solid #94a3b8;
        }

        .section-box.highlight-emerald {
            background: #f0fdf4;
            border: 1.5px solid #334155;
        }

        .section-heading {
            font-weight: 900;
            font-size: ${isA5 ? '9.8pt' : '11pt'};
            color: #1e3a8a;
            margin: ${isA5 ? '7px 0 4px' : '10px 0 5px'};
        }

        p {
            margin: 0 0 ${isA5 ? '6px' : '8px'};
            text-align: justify;
            orphans: 3;
            widows: 3;
        }

        .clause-item {
            margin-bottom: ${isA5 ? '5px' : '7px'};
            text-align: justify;
        }

        .clause-num {
            font-weight: 900;
            color: #1e3a8a;
        }

        .val-strong {
            font-weight: 800;
            color: #0f172a;
        }

        .val-accent {
            font-weight: 800;
            color: #1e3a8a;
        }

        .val-money {
            font-weight: 900;
            color: #065f46;
        }

        .pill-inline {
            display: inline-block;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e3a8a;
            padding: 0 6px;
            border-radius: 5px;
            font-weight: 800;
        }

        .pill-sheba {
            display: inline-block;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            padding: 0 7px;
            border-radius: 5px;
            font-weight: 800;
            direction: ltr;
            unicode-bidi: embed;
        }

        .pill-car {
            display: inline-block;
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #0f172a;
            padding: 0 6px;
            border-radius: 5px;
            font-weight: 800;
        }

        .two-col-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: ${isA5 ? '8px' : '12px'};
            margin-bottom: ${isA5 ? '8px' : '11px'};
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .three-col-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: ${isA5 ? '6px' : '10px'};
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: ${isA5 ? '6px 8px' : '8px 10px'};
            margin: 6px 0;
            font-size: ${isA5 ? '8.5pt' : '9.5pt'};
            font-weight: 800;
        }

        .check-row {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-bottom: 4px;
        }
        .check-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1.4px solid #334155;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: 900;
            flex-shrink: 0;
            background: #ffffff;
        }

        .sign-split {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
            font-size: ${isA5 ? '9pt' : '10pt'};
        }

        /* Signatures */
        .signature-grid {
            margin-top: ${isA5 ? '14px' : '22px'};
            padding-top: ${isA5 ? '10px' : '14px'};
            border-top: 2px solid #0f172a;
            display: grid;
            gap: ${isA5 ? '10px' : '16px'};
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .signature-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .signature-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }

        .sig-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
            padding: ${isA5 ? '8px 6px' : '10px 10px'};
            text-align: center;
            min-height: ${isA5 ? '76px' : '94px'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .sig-title {
            font-weight: 900;
            font-size: ${isA5 ? '8.8pt' : '9.8pt'};
            color: #0f172a;
        }

        .sig-sub {
            font-size: ${isA5 ? '7.6pt' : '8.4pt'};
            color: #475569;
            margin-top: 2px;
        }

        .sig-placeholder {
            font-size: ${isA5 ? '7.2pt' : '8pt'};
            color: #94a3b8;
            margin-top: ${isA5 ? '22px' : '30px'};
        }

        /* Bank Letter Auth & Sign Footer */
        .bank-footer-grid {
            margin-top: ${isA5 ? '18px' : '28px'};
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .auth-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: ${isA5 ? '8px 10px' : '10px 14px'};
            font-size: ${isA5 ? '7.8pt' : '8.8pt'};
            color: #475569;
            line-height: 1.75;
            min-width: ${isA5 ? '170px' : '220px'};
        }

        .stamp-card {
            text-align: center;
            min-width: ${isA5 ? '180px' : '230px'};
        }

        /* Screen document footer (in print @page margin box also displays page numbers + phone) */
        .doc-footer {
            margin-top: ${isA5 ? '14px' : '20px'};
            padding-top: 7px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: ${isA5 ? '7.4pt' : '8.2pt'};
            color: #64748b;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .confirm-line {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-weight: 700;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        @media print {
            html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
            }

            .sheet-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background-image: none !important;
                background-color: #ffffff !important;
                display: block !important;
                overflow: visible !important;
            }

            .watermark-layer {
                position: fixed !important;
                opacity: 0.03 !important;
            }
        }
    </style>
    `;
}

function buildHeaderHtml(opts: {
    title: string;
    subtitle?: string;
    themeClass?: string;
    basmala?: string;
    docNumber: string;
    docDate: string;
    attachment?: string;
    showPhoneInHeader?: boolean;
}): string {
    return `
        <header class="doc-header">
            <div class="brand-block">
                <div class="brand-badge">۲۶۰۶</div>
                <div>
                    <div class="brand-title">شرکت تضامنی حسینی خودرو شیراز</div>
                    <div class="brand-sub">نمایندگی رسمی کرمان موتور - کد ۲۶۰۶</div>
                    ${opts.showPhoneInHeader ? `<div class="brand-sub">تلفن: ${COMPANY_PHONE_PERSIAN}</div>` : ''}
                </div>
            </div>

            <div class="title-block">
                ${opts.basmala ? `<div class="basmala">${escapeHtml(opts.basmala)}</div>` : ''}
                <h1 class="doc-title ${opts.themeClass || ''}">${escapeHtml(opts.title)}</h1>
                ${opts.subtitle ? `<div class="doc-subtitle">${escapeHtml(opts.subtitle)}</div>` : ''}
            </div>

            <div class="meta-block">
                <div class="meta-row">
                    <span class="meta-label">شماره:</span>
                    <span class="meta-val ltr">${escapeHtml(toPersianDigits(opts.docNumber || '-'))}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">تاریخ:</span>
                    <span class="meta-val ltr">${escapeHtml(toPersianDigits(opts.docDate || '-'))}</span>
                </div>
                ${opts.attachment ? `
                <div class="meta-row">
                    <span class="meta-label">پیوست:</span>
                    <span class="meta-val">${escapeHtml(opts.attachment)}</span>
                </div>
                ` : ''}
            </div>
        </header>
    `;
}

function renderPeaceContractBody(c: CarPeaceContract): { title: string; body: string } {
    const contractNo = c.contractNumber || '1405/PC-1001';
    const contractDate = c.contractDate || '1405/06/22';
    const companyPhone = (!c.releasorPhone || c.releasorPhone === '09370518538') ? '07191690906' : c.releasorPhone;
    const totalWords = c.totalAmountRials > 0 ? numberToPersianWords(c.totalAmountRials) : '';
    const totalFormatted = c.totalAmountRials > 0 ? formatCurrencyWithCommas(c.totalAmountRials) : '........................';
    const paidFormatted = c.paidAmountRials > 0
        ? formatCurrencyWithCommas(c.paidAmountRials)
        : (c.totalAmountRials > 0 ? formatCurrencyWithCommas(c.totalAmountRials) : '........................');
    const shebaFormatted = c.releaseeShebaNumber ? ('IR' + c.releaseeShebaNumber.replace(/^IR/i, '')) : '........................';

    const header = buildHeaderHtml({
        title: 'قرارداد صلح خودرو',
        subtitle: '(مشمول ماده ۱۰ قانون مدنی)',
        basmala: 'بسمه تعالی',
        docNumber: contractNo,
        docDate: contractDate,
        attachment: 'چک‌لیست تحویل',
        showPhoneInHeader: true
    });

    const notesSection = c.notes && c.notes.trim()
        ? `
        <div class="section-heading">بندهای الحاقی و توضیحات تکمیلی:</div>
        <p>${nl2brEscaped(c.notes.trim())}</p>
        `
        : '';

    const body = `
        ${header}

        <div class="party-card">
            <span class="val-accent">مصالح (واگذارکننده): </span>
            <span class="val-strong">${escapeHtml(c.releasorName || 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی')}</span>
            &nbsp;|&nbsp;
            <strong>شناسه ملی:</strong> <span class="ltr val-strong">${escapeHtml(toPersianDigits(c.releasorNationalId || '14012274787'))}</span>
            &nbsp;|&nbsp;
            <strong>آدرس:</strong> ${escapeHtml(c.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال')}
            &nbsp;|&nbsp;
            <strong>کد پستی:</strong> <span class="ltr">${escapeHtml(toPersianDigits(c.releasorPostalCode || '7173714734'))}</span>
            &nbsp;|&nbsp;
            <strong>تلفن:</strong> <span class="ltr val-strong">${escapeHtml(toPersianDigits(companyPhone))}</span>
        </div>

        <div class="party-card secondary">
            <div>
                <span class="val-accent">متصالح (خریدار): </span>
                <span class="val-accent">${escapeHtml(c.releaseeTitle || 'آقای/خانم')} ${escapeHtml(c.releaseeName || '................................')}</span>
                &nbsp;&nbsp;
                <strong>فرزند:</strong> ${escapeHtml(c.releaseeFatherName || '..........')}
                &nbsp;&nbsp;
                <strong>شماره شناسنامه:</strong> <span class="ltr">${escapeHtml(toPersianDigits(c.releaseeIdNumber) || '..........')}</span>
                &nbsp;&nbsp;
                <strong>صادره از:</strong> ${escapeHtml(c.releaseeIssuePlace || '..........')}
                &nbsp;&nbsp;
                <strong>کد ملی:</strong> <span class="ltr val-accent">${escapeHtml(toPersianDigits(c.releaseeNationalCode) || '..........')}</span>
            </div>
            <div style="margin-top: 3px;">
                <strong>آدرس:</strong> ${escapeHtml(c.releaseeAddress || '............................................................')}
                &nbsp;&nbsp;
                <strong>کد پستی:</strong> <span class="ltr">${escapeHtml(toPersianDigits(c.releaseePostalCode) || '..........')}</span>
                &nbsp;&nbsp;
                <strong>تلفن:</strong> <span class="ltr">${escapeHtml(toPersianDigits(c.releaseePhone) || '..........')}</span>
            </div>
        </div>

        <p class="avoid-break">
            <span class="val-accent">مورد صلح: </span>
            یک دستگاه خودروی <span class="val-accent">${escapeHtml(c.carModel || '....................')}</span>
            به شماره شاسی <span class="ltr val-strong">${escapeHtml(c.chassisNumber || '................................')}</span>
            به شماره پلاک انتظامی <span class="val-strong">${escapeHtml(c.plateNumber || '....................')}</span>
            مدل <span class="val-strong">${escapeHtml(toPersianDigits(c.modelYear) || '....')}</span>
            رنگ <span class="val-strong">${escapeHtml(c.color || '..........')}</span>
            به همراه کلیه متعلقات طبق چک‌لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.
        </p>

        <p class="avoid-break">
            <span class="val-accent">مبلغ مورد صلح: </span>
            <span class="val-money">${escapeHtml(toPersianDigits(totalFormatted))} ریال</span>
            ${totalWords ? `<span>(${escapeHtml(totalWords)} ریال)</span>` : ''}
            که مبلغ <span class="val-strong">${escapeHtml(toPersianDigits(paidFormatted))} ریال</span>
            به شماره پیگیری <span class="ltr val-strong">${escapeHtml(toPersianDigits(c.trackingNumber) || '....................')}</span>
            واریز گردید.
        </p>

        <p>
            <span class="val-accent">توضیحات: </span>
            کلیه مخارج انتقال سند و عوارض شهرداری و مالیات نقل و انتقال به عهده متصالح می‌باشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. سند خودرو فوق پس از به نام خوردن به نام مصالح، در دفترخانه اسناد رسمی به صورت وکالت تعویض پلاک به نام متصالح انتقال می‌یابد. متصالح نیز متعهد می‌گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک مصالح را فک نماید؛ در غیر این صورت روزانه مبلغ ۵۰۰ هزار تومان خسارت باید به مصالح پرداخت نماید. این معامله در تاریخ <span class="val-strong">${escapeHtml(toPersianDigits(contractDate))}</span> و ساعت <span class="val-strong">${escapeHtml(toPersianDigits(c.transactionTime) || '....:....')}</span> بصورت قطعی انجام شد و حق فسخ وجود ندارد. ارتکاب هرگونه خلافی از تاریخ تحویل خودرو به عهده متصالح می‌باشد.
        </p>

        <div class="section-heading">شروط و تعهدات قرارداد:</div>

        <p class="clause-item avoid-break"><span class="clause-num">۱- </span>کلیه هزینه‌های قراردادی، مالیات‌ها، عوارض، بیمه شخص ثالث، مالیات ارزش افزوده و سایر هزینه‌هایی که قانون یا قرارداد پرداخت آن را به عهده متصالح و مصرف‌کننده گذاشته است، به عهده متصالح می‌باشد. بدیهی است نرخ‌های موارد فوق بر اساس قوانین و توافقات فعلی محاسبه شده است.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۲- </span>متصالح در کمال صحت عقل و اختیار و به موجب مفاد این صلح‌نامه کافه خیارات خصوصاً خیار غبن ولو فاحش به اعلی مرتبه و نیز هرگونه ادعایی نسبت به خودروی موضوع صلح را از جمله گرانفروشی و غیره و حق هرگونه دعوی و یا شکایت و اعتراض در هر یک از مراجع اداری، انتظامی و قضایی از خود سلب و ساقط نمود.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۳- </span>مرجع رسیدگی به هرگونه شکایت یا دعوی در خصوص این قرارداد شهرستان شیراز می‌باشد.</p>

        <p class="clause-item"><span class="clause-num">۴- </span>در صورت بروز هرگونه اختلاف در تفسیر و یا تعبیر یا اجرای این قرارداد (صلح‌نامه) اعم از اجرای تعهدات، انحلال قرارداد (اقاله، فسخ، انفساخ، بطلان و ابطال و اتمام مدت)، آثار و تبعات و الزامات بعد از انحلال قرارداد، خسارات، تفسیر و غیره بدواً از طریق مذاکره حداکثر ظرف مدت ۱۵ روز حل و فصل خواهد شد و در صورت عدم حصول نتیجه موضوع از طریق داور مرضی‌الطرفین <span class="val-strong">آقای محمد شکرشکن</span> به شماره ملی <span class="ltr val-strong">۲۲۹۸۹۲۰۰۸۷</span> با شناسه داوری <span class="ltr val-strong">۹۸۱۸۸</span> و عضو کانون داوران استان فارس رسیدگی و حل و فصل می‌گردد. مدت داوری سه ماه و با تشخیص داور مدت سه ماه دیگر نیز قابل افزایش است و رای داور برای طرفین و قائم‌مقام قانونی آنان لازم‌الاتباع است و شرط داوری مستقل از اعتبار و صحت و بقای قرارداد (صلح‌نامه) است.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۵- </span><span class="val-strong">اطلاعات حساب بانکی متصالح:</span> شماره حساب <span class="ltr val-strong">${escapeHtml(toPersianDigits(c.releaseeAccountNumber) || '....................')}</span>، شماره شبا <span class="pill-sheba">${escapeHtml(shebaFormatted)}</span> نزد بانک <span class="val-strong">${escapeHtml(c.releaseeBankName || '..........')}</span> می‌باشد که پرداخت کلیه ثمن معامله صرفاً از طریق حساب مذکور انجام خواهد شد.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۶- </span>تمامی مکاتبات و تماس و پیامک‌ها به آدرس و شماره همراه مذکور ابلاغ و اعلام می‌گردد. بدیهی است در صورت هرگونه تغییر در آدرس یا شماره تلفن همراه و اطلاعات حساب بانکی فوق‌الذکر متصالح موظف است ظرف مدت ۳ روز مراتب را کتباً به مصالح اعلام نماید. در غیر اینصورت مسئولیت آن متوجه متصالح می‌باشد.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۷- </span>تنظیم صورتجلسه تحویل خودرو به منزله تایید صحت و سلامت خودروی تحویل گرفته شده از سوی مصالح می‌باشد. با این وجود مسئولیت رفع هرگونه ایراد و یا نقص فنی خودرو و جبران خسارات به عهده مراجع و نمایندگی‌های مجاز خدمات پس از فروش شرکت کرمان موتور است و از این حیث هیچ مسئولیتی متوجه مصالح نیست.</p>

        <p class="clause-item avoid-break"><span class="clause-num">۸- </span>این صلح‌نامه در تاریخ <span class="val-strong">${escapeHtml(toPersianDigits(contractDate))}</span> طبق ماده ۱۰ قانون مدنی در دو نسخه با متن و حکم و اعتبار واحد فی‌مابین طرفین امضا و مبادله شد و مفاد آن برای طرفین لازم‌الاتباع است.</p>

        ${notesSection}

        <div class="confirm-line">
            اینجانب <span class="val-accent">${escapeHtml(c.releaseeTitle || 'آقای/خانم')} ${escapeHtml(c.releaseeName || '................................')}</span> با مطالعه دقیق قرارداد فوق و علم و آگاهی کامل از مفاد آن با رضایت آن را امضاء نمودم.
        </div>

        <div class="signature-grid cols-3">
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء و مهر مصالح</div>
                    <div class="sig-sub">شرکت تضامنی حسینی خودرو شیراز<br/>(نمایندگی ۲۶۰۶ کرمان موتور)</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء و مهر رسمی ]</div>
            </div>
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء و اثر انگشت متصالح</div>
                    <div class="sig-sub">${escapeHtml(c.releaseeTitle || 'آقای/خانم')} ${escapeHtml(c.releaseeName || '....................')}</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء و اثر انگشت ]</div>
            </div>
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء شهود معامله</div>
                    <div class="sig-sub">شاهد اول / شاهد دوم</div>
                </div>
                <div class="sig-placeholder">امضاء شاهد اول: ...............<br/>امضاء شاهد دوم: ...............</div>
            </div>
        </div>
    `;

    return { title: `قرارداد صلح خودرو - ${c.releaseeName || 'مشتری'} (${contractNo})`, body };
}

function renderBankLetterBody(l: BankLetter): { title: string; body: string } {
    const letterNo = l.letterNumber || '1405/KM2606/---';
    const letterDate = l.letterDate || '1405/06/22';
    const formattedAmount = formatCurrencyWithCommas(l.amountRials);
    const amountInWords = l.amountWords || (numberToPersianWords(l.amountRials) + ' ریال');
    const branchText = l.destinationBranchName ? ` ${l.destinationBranchName}` : '';
    const colorText = l.carColor ? ` به رنگ ${l.carColor}` : '';
    const yearText = l.carModelYear ? ` مدل ${l.carModelYear}` : '';

    const header = buildHeaderHtml({
        title: 'نامه معرفی به بانک',
        subtitle: 'حواله بانکی و انتقال وجه',
        themeClass: 'theme-blue',
        basmala: 'بنام خدا',
        docNumber: letterNo,
        docDate: letterDate,
        attachment: 'ندارد',
        showPhoneInHeader: true
    });

    const notesSection = l.notes && l.notes.trim()
        ? `
        <div class="section-box highlight-blue">
            <div class="val-accent" style="margin-bottom:4px;">توضیحات تکمیلی:</div>
            <div>${nl2brEscaped(l.notes.trim())}</div>
        </div>
        `
        : '';

    const body = `
        ${header}

        <div class="avoid-break" style="margin: 14px 0 12px;">
            <div style="font-size: 1.15em; font-weight: 900; color: #0f172a;">
                ریاست محترم ${escapeHtml(l.destinationBankName || 'بانک ...')}${escapeHtml(branchText)}
            </div>
            <div style="font-weight: 800; color: #334155; margin-top: 4px;">
                با سلام و احترام؛
            </div>
        </div>

        <p style="font-size: 1.04em; line-height: 2.35; margin: 12px 0;">
            احتراماً <span class="val-strong">${escapeHtml(l.customerTitle || 'خانم/آقای')}</span>
            <span class="pill-inline">${escapeHtml(l.customerName || '....................')}</span>
            به کدملی <span class="ltr val-strong" style="background:#f1f5f9; padding:0 6px; border-radius:4px;">${escapeHtml(toPersianDigits(l.customerNationalCode) || '..........')}</span>
            جهت امور بانکی و واریز وجه به مبلغ
            <span class="pill-inline">${escapeHtml(toPersianDigits(formattedAmount || '0'))} ریال</span>
            <span style="color:#334155;">(${escapeHtml(amountInWords)})</span>
            <span class="val-strong">${escapeHtml(l.paymentMethod || 'بصورت حواله ساتنا')}</span>
            به شماره شبا <span class="pill-sheba">${escapeHtml(l.shebaNumber || '........................')}</span>
            نزد <span class="val-strong">${escapeHtml(l.beneficiaryBankName || 'بانک ...')}</span>
            بنام <span class="pill-inline">${escapeHtml(l.accountHolderName || 'شرکت حسینی خودرو شیراز')}</span>
            جهت خرید یک دستگاه <span class="pill-car">${escapeHtml(l.carModel || '...')}</span>
            ${yearText ? `<span class="val-strong">${escapeHtml(toPersianDigits(yearText))}</span>` : ''}
            ${colorText ? `<span class="val-strong">${escapeHtml(colorText)}</span>` : ''}
            به خدمت حضورتان معرفی می‌گردند.
        </p>

        <p style="font-size: 1.02em; font-weight: 600; margin: 12px 0 16px;">
            خواهشمند است بذل لطف نموده همکاری‌های لازم با نامبرده را مبذول فرمایید.
        </p>

        ${notesSection}

        <div class="bank-footer-grid">
            <div class="auth-card">
                <div style="font-weight:900; color:#0f172a; margin-bottom:2px;">اصالت‌سنجی نامه اداری</div>
                <div>کد یکتا: <span class="ltr val-strong">${escapeHtml(letterNo)}</span></div>
                <div>سامانه جامع نمایندگی ۲۶۰۶ کرمان موتور</div>
                <div style="font-size:0.88em; color:#64748b;">تلفن استعلام: ${COMPANY_PHONE_PERSIAN}</div>
            </div>

            <div class="stamp-card">
                <div style="font-weight:800; color:#334155;">با تشکر و احترام</div>
                <div style="font-weight:900; font-size:1.08em; color:#1e3a8a; margin-top:3px;">
                    ${escapeHtml(l.dealershipName || 'نمایندگی ۲۶۰۶ کرمان موتور')}
                </div>
                <div style="font-size:0.9em; color:#475569;">(شرکت حسینی خودرو شیراز)</div>
                <div style="margin-top:34px; font-size:0.85em; color:#94a3b8;">[ محل امضاء و مهر رسمی نمایندگی ]</div>
            </div>
        </div>
    `;

    return { title: `نامه معرفی به بانک - ${l.customerName || 'مشتری'} (${letterNo})`, body };
}

function renderPreContractBody(f: PreContractForm): { title: string; body: string } {
    const docNo = f.contractNumber || '1405/PRE-1001';
    const docDate = f.contractDate || '1405/06/22';
    const totalFmt = f.totalPriceRials > 0 ? formatCurrencyWithCommas(f.totalPriceRials) : '...............................';
    const totalWords = f.totalPriceRials > 0 ? numberToPersianWords(f.totalPriceRials) : '';
    const prepayFmt = f.prepaymentRials > 0 ? formatCurrencyWithCommas(f.prepaymentRials) : '................................';
    const prepayWords = f.prepaymentRials > 0 ? numberToPersianWords(f.prepaymentRials) : '';

    const header = buildHeaderHtml({
        title: 'فرم پیش قرارداد',
        subtitle: 'نمایندگی ۲۶۰۶ حسینی خودرو شیراز',
        themeClass: 'theme-violet',
        basmala: 'بسمه تعالی',
        docNumber: docNo,
        docDate: docDate,
        showPhoneInHeader: true
    });

    const body = `
        ${header}

        <div class="party-card">
            <div class="val-accent" style="margin-bottom:4px;">مشخصات خریدار:</div>
            <p style="margin:0;">
                اینجانب <span class="val-accent">${escapeHtml(f.buyerTitle || 'خانم / آقای')} ${escapeHtml(f.buyerName || '.................................')}</span>
                فرزند <span class="val-strong">${escapeHtml(f.buyerFatherName || '............................')}</span>
                به کدملی <span class="ltr val-accent">${escapeHtml(toPersianDigits(f.buyerNationalCode) || '.........................')}</span>
                متقاضی خرید یک دستگاه خودرو <span class="val-accent">${escapeHtml(f.carModel || '...............................')}</span>
                مدل <span class="val-strong">${escapeHtml(toPersianDigits(f.modelYear) || '..................')}</span>
                رنگ <span class="val-strong">${escapeHtml(f.color || '................')}</span>
                در نمایندگی ۲۶۰۶ حسینی می‌باشم.
            </p>
        </div>

        <p style="margin-top:12px;">
            - ثمن مورد معامله به مبلغ <span class="val-money">${escapeHtml(toPersianDigits(totalFmt))} ریال</span>
            ${totalWords ? `<span>(${escapeHtml(totalWords)} ریال)</span>` : ''}
            مورد تایید اینجانب می‌باشد.
        </p>

        <p>
            - متعهد می‌گردم همزمان با این درخواست، مبلغ <span class="val-accent">${escapeHtml(toPersianDigits(prepayFmt))} ریال</span>
            ${prepayWords ? `<span>(${escapeHtml(prepayWords)} ریال)</span>` : ''}
            به عنوان پیش‌پرداخت به حساب کرمان موتور ۲۶۰۶ حسینی واریز نمایم.
        </p>

        <p>
            - الباقی ثمن معامله مورخ <span class="val-strong" style="color:#b45309;">${escapeHtml(toPersianDigits(f.remainingPaymentDate) || '..........................')}</span>
            پرداخت می‌گردد. در صورت عدم پرداخت مابقی وجه در موعد مقرر معامله به صورت یکطرفه از سوی فروشنده فسخ خواهد شد.
        </p>

        <div class="section-box highlight-amber">
            <p style="margin:0;">
                - چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت حسینی خودرو شیراز مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت ۳۰ روز به اینجانب اعاده نماید.
            </p>
        </div>

        <div class="signature-grid cols-2">
            <div class="sig-box">
                <div>
                    <div class="sig-title">نام و امضای خریدار</div>
                    <div class="sig-sub">${escapeHtml(f.buyerTitle || '')} ${escapeHtml(f.buyerName || '........................................')}</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء متقاضی ]</div>
            </div>
            <div class="sig-box">
                <div>
                    <div class="sig-title">اثر انگشت</div>
                    <div class="sig-sub">تایید صحت و اصالت</div>
                </div>
                <div class="sig-placeholder">[ محل ثبت اثر انگشت متقاضی ]</div>
            </div>
        </div>
    `;

    return { title: `فرم پیش قرارداد - ${f.buyerName || 'خریدار'} (${docNo})`, body };
}

function renderRemittanceBody(f: RemittanceApprovalForm): { title: string; body: string } {
    const docNo = f.formNumber || '1405/REM-1001';
    const docDate = f.formDate || '1405/06/22';
    const totalStr = f.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(f.totalAmountRials))} ریال` : '......................................';
    const paidStr = f.paidAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(f.paidAmountRials))} ریال` : '................................';
    const remStr = f.remainingAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(f.remainingAmountRials))} ریال`
        : (f.totalAmountRials > 0 && f.paidAmountRials >= f.totalAmountRials ? '۰ ریال (تسویه کامل)' : '.................................');

    const header = buildHeaderHtml({
        title: 'فرم تایید نهایی حواله',
        subtitle: 'نمایندگی حسینی خودرو شیراز (کد ۲۶۰۶)',
        themeClass: 'theme-emerald',
        docNumber: docNo,
        docDate: docDate,
        showPhoneInHeader: true
    });

    const chk = (checked: boolean) => `<span class="check-box">${checked ? '✓' : ''}</span>`;

    const body = `
        ${header}

        <div class="two-col-grid">
            <div class="party-card" style="margin:0;">
                <div class="val-accent" style="border-bottom:1px solid #cbd5e1; padding-bottom:3px; margin-bottom:5px;">۱. مشخصات خودرو:</div>
                <div><strong>نوع خودرو:</strong> <span class="val-accent">${escapeHtml(f.carModel || '……………………………………')}</span></div>
                <div><strong>رنگ:</strong> <span class="val-strong">${escapeHtml(f.color || '………………………………………')}</span></div>
                <div><strong>زمان تحویل:</strong> <span class="val-strong">${escapeHtml(toPersianDigits(f.deliveryTime) || '………………………………')}</span></div>
            </div>
            <div class="party-card secondary" style="margin:0;">
                <div class="val-accent" style="border-bottom:1px solid #cbd5e1; padding-bottom:3px; margin-bottom:5px;">۲. اطلاعات مشتری:</div>
                <div><strong>نام و نام خانوادگی:</strong> <span class="val-accent">${escapeHtml(f.customerName || '.............................')}</span></div>
                <div><strong>کدملی:</strong> <span class="ltr val-strong">${escapeHtml(toPersianDigits(f.customerNationalCode) || '......................................')}</span></div>
                <div><strong>شماره تماس:</strong> <span class="ltr val-strong">${escapeHtml(toPersianDigits(f.customerPhone) || '.................................')}</span></div>
            </div>
        </div>

        <div class="section-box highlight-blue">
            <div class="val-accent" style="margin-bottom:6px;">۳. کنترل وضعیت مالی (مسئولیت کامل با حسابداری):</div>
            <div class="check-row">${chk(f.accCheckNoDebt)}<span>هیچ‌گونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است</span></div>
            <div class="check-row">${chk(f.accCheckMatched)}<span>کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است</span></div>
            <div class="check-row">${chk(f.accCheckClear)}<span>حواله خودرو از نظر مالی بلامانع است</span></div>

            <div class="three-col-bar">
                <div>مبلغ کل: <span class="val-strong">${escapeHtml(totalStr)}</span></div>
                <div>مبلغ واریزی: <span class="val-money">${escapeHtml(paidStr)}</span></div>
                <div>مانده حساب: <span style="color:#b45309;">${escapeHtml(remStr)}</span></div>
            </div>

            <div class="sign-split">
                <div><strong>نام مسئول حسابداری:</strong> ${escapeHtml(f.accountingManagerName || '....................')}</div>
                <div><strong>امضا و تاریخ:</strong> ${escapeHtml(toPersianDigits(f.accountingDate) || '....................')}</div>
            </div>
        </div>

        <div class="section-box highlight-blue">
            <div class="val-accent" style="margin-bottom:6px;">۴. کنترل وضعیت فروش (مسئولیت کامل با مسئول فروش):</div>
            <div class="check-row">${chk(f.salesCheckCorrect)}<span>اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است</span></div>
            <div class="check-row">${chk(f.salesCheckInvoice)}<span>مبلغ فاکتور، تخفیف‌ها، شرایط فروش و مانده حساب کنترل شد</span></div>

            <div class="sign-split">
                <div><strong>نام مسئول فروش:</strong> ${escapeHtml(f.salesManagerName || '...........................')}</div>
                <div><strong>امضا و تاریخ:</strong> ${escapeHtml(toPersianDigits(f.salesDate) || '....................')}</div>
            </div>
            <div style="margin-top:6px;">
                <strong>توضیحات:</strong> ${escapeHtml(f.salesNotes || '..............................................')}
            </div>
        </div>

        <div class="section-box highlight-emerald">
            <div class="val-accent" style="margin-bottom:6px; color:#065f46;">۵. مدیریت تأیید می‌کند:</div>
            <div class="check-row">${chk(f.mgmtCheckSignatures)}<span class="val-strong">تمامی امضاها کنترل</span></div>
            <div class="sign-split">
                <div><strong>مسئولیت فروش با:</strong> <span class="val-accent">${escapeHtml(f.salesResponsibilityWith || '......................................')}</span></div>
                <div><strong>مهر و امضای مدیریت:</strong> ....................</div>
            </div>
        </div>
    `;

    return { title: `فرم تایید نهایی حواله - ${f.customerName || 'مشتری'} (${docNo})`, body };
}

function renderFreeBillBody(f: FreeBillOfSale): { title: string; body: string } {
    const docNo = f.contractNumber || '1405/FB-1001';
    const docDate = f.contractDate || '1405/06/22';
    const amountFormatted = f.totalAmountRials > 0 ? formatCurrencyWithCommas(f.totalAmountRials) : '.................................';
    const amountWords = f.totalAmountRials > 0 ? numberToPersianWords(f.totalAmountRials) : '';

    const header = buildHeaderHtml({
        title: 'قولنامه آزاد',
        subtitle: 'مبایعه‌نامه قطعی خودرو',
        themeClass: 'theme-teal',
        basmala: 'بسمه تعالی',
        docNumber: docNo,
        docDate: docDate,
        showPhoneInHeader: true
    });

    const body = `
        ${header}

        <div class="party-card">
            <div>
                <span class="val-accent">فروشنده: </span>
                <span class="val-accent">${escapeHtml(f.sellerTitle || 'خانم / آقای')} ${escapeHtml(f.sellerName || '........................')}</span>
                &nbsp;&nbsp;
                <strong>فرزند:</strong> ${escapeHtml(f.sellerFatherName || '..............')}
                &nbsp;&nbsp;
                <strong>به شماره شناسنامه:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.sellerIdNumber) || '..............')}</span>
                &nbsp;&nbsp;
                <strong>صادره از:</strong> ${escapeHtml(f.sellerIssuePlace || '............')}
                &nbsp;&nbsp;
                <strong>کد ملی:</strong> <span class="ltr val-accent">${escapeHtml(toPersianDigits(f.sellerNationalCode) || '....................')}</span>
            </div>
            <div style="margin-top:3px;">
                <strong>آدرس:</strong> ${escapeHtml(f.sellerAddress || '................................................................')}
                &nbsp;&nbsp;
                <strong>کد پستی:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.sellerPostalCode) || '................')}</span>
                &nbsp;&nbsp;
                <strong>تلفن:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.sellerPhone) || '................')}</span>
            </div>
        </div>

        <div class="party-card secondary">
            <div>
                <span class="val-accent">خریدار: </span>
                <span class="val-accent">${escapeHtml(f.buyerTitle || 'خانم/آقای')} ${escapeHtml(f.buyerName || '........................')}</span>
                &nbsp;&nbsp;
                <strong>فرزند:</strong> ${escapeHtml(f.buyerFatherName || '..............')}
                &nbsp;&nbsp;
                <strong>به شماره شناسنامه:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.buyerIdNumber) || '..............')}</span>
                &nbsp;&nbsp;
                <strong>صادره از:</strong> ${escapeHtml(f.buyerIssuePlace || '............')}
                &nbsp;&nbsp;
                <strong>کد ملی:</strong> <span class="ltr val-accent">${escapeHtml(toPersianDigits(f.buyerNationalCode) || '....................')}</span>
            </div>
            <div style="margin-top:3px;">
                <strong>آدرس:</strong> ${escapeHtml(f.buyerAddress || '................................................................')}
                &nbsp;&nbsp;
                <strong>کدپستی:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.buyerPostalCode) || '................')}</span>
                &nbsp;&nbsp;
                <strong>تلفن:</strong> <span class="ltr">${escapeHtml(toPersianDigits(f.buyerPhone) || '................')}</span>
            </div>
        </div>

        <div class="section-box">
            <p style="margin-bottom:4px;">
                <span class="val-accent">مورد معامله: </span>
                یکدستگاه خودروی <span class="val-accent">${escapeHtml(f.carModel || '....................')}</span>
                &nbsp;|&nbsp;
                <strong>شماره بدنه:</strong> <span class="ltr val-strong">${escapeHtml(f.chassisNumber || '........................')}</span>
                &nbsp;|&nbsp;
                <strong>رنگ:</strong> <span class="val-strong">${escapeHtml(f.color || '..........')}</span>
                &nbsp;|&nbsp;
                <strong>شماره شهربانی:</strong> <span class="val-strong">${escapeHtml(f.plateNumber || '....................')}</span>
            </p>
            <p style="margin:0;">
                <span class="val-accent">مبلغ مورد معامله: </span>
                <span class="val-money">${escapeHtml(toPersianDigits(amountFormatted))} ریال</span>
                ${amountWords ? `<span>(${escapeHtml(amountWords)} ریال)</span>` : ''}
                ${f.totalAmountDescription ? `<span style="color:#475569;"> — ${escapeHtml(f.totalAmountDescription)}</span>` : ''}
            </p>
        </div>

        <p>
            <span class="val-accent">توضیحات: </span>
            کلیه مخارج عوارض شهرداری و مالیات نقل و انتقال به عهده خریدار می‌باشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. فروشنده متعهد می‌گردد که ظرف مدت ۱۰ روز در دفترخانه اسناد رسمی حاضر و وکالت تعویض پلاک را به نام خریدار تنظیم نماید در غیر اینصورت روزانه مبلغ ۵۰۰ هزار تومان می‌بایست فروشنده به خریدار پرداخت نماید. خریدار نیز متعهد می‌گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک فروشنده را فک نماید. این معامله در تاریخ <span class="val-strong">${escapeHtml(toPersianDigits(f.contractDate) || '............')}</span> و ساعت <span class="val-strong">${escapeHtml(toPersianDigits(f.transactionTime) || '....:....')}</span> بصورت قطعی انجام شد و حق فسخ ندارد. کشف فساد و خلافی تا این تاریخ به عهده فروشنده می‌باشد و از این تاریخ به بعد به عهده خریدار می‌باشد. خریدار از کم و کیف خودرو اطلاع داشته و خودرو صحیح و سالم به رویت کامل ایشان رسید. قیمت معامله براساس قیمت روز و شرایط وضعیت موجود بوده و خریدار با علم و اطلاع اقدام به خرید کرده‌اند و نوسانات قیمت هیچ گونه تاثیری در مبایعه‌نامه ندارد و هرگونه ادعائی در حال و آینده از خود سلب می‌نماید. فروشنده و خریدار با امضا ذیل مبایعه‌نامه از کلیه مفاد قرارداد و مبایعه‌نامه مطلع و آگاه شده‌اند و با اراده شخصی و با علم و آگاهی از کم و کیف خودرو مورد معامله و اوضاع و احوال و زمان و مکان و نیز رضایت از ثمن معامله بین طرفین منعقد گردید. تمام کافه خیارات بخصوص غبن فاحش و تدلیس از طرفین ساقط گردید. مرجع رسیدگی به هرگونه شکایت در خصوص این مبایعه‌نامه شهرستان شیراز می‌باشد. چنانچه خریدار ظرف مدت مقرر در وکالت، تعویض پلاک ننماید از زمان اتمام تاریخ وکالت اولیه تا تاریخ تعویض پلاک روزانه مبلغ ۵۰۰ هزار تومان می‌بایست خریدار به فروشنده پرداخت نماید و هزینه وکالت مجدد با خریدار می‌باشد. تمامی مدارک خودرو اعم از <span class="val-accent">${escapeHtml(f.deliveredDocuments || '................................................................')}</span> تحویل خریدار گردید.
        </p>

        <div class="signature-grid cols-3">
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء فروشنده</div>
                    <div class="sig-sub">${escapeHtml(f.sellerTitle || '')} ${escapeHtml(f.sellerName || '....................')}</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء و اثر انگشت ]</div>
            </div>
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء خریدار</div>
                    <div class="sig-sub">${escapeHtml(f.buyerTitle || '')} ${escapeHtml(f.buyerName || '....................')}</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء و اثر انگشت ]</div>
            </div>
            <div class="sig-box">
                <div>
                    <div class="sig-title">امضاء شاهد</div>
                    <div class="sig-sub">نام و امضای شاهد</div>
                </div>
                <div class="sig-placeholder">[ محل امضاء شاهد ]</div>
            </div>
        </div>
    `;

    return { title: `قولنامه آزاد - ${f.buyerName || f.sellerName || 'مشتری'} (${docNo})`, body };
}

export function buildOfficialDocumentHtml(
    payload: OfficialDocPayload,
    options: HtmlPrintBuildOptions = {}
): string {
    const paperSize: DocumentPaperSize = options.paperSize || 'A4';
    const showWatermark = options.showWatermark ?? true;

    let rendered: { title: string; body: string };
    switch (payload.type) {
        case 'PEACE_CONTRACT':
            rendered = renderPeaceContractBody(payload.data);
            break;
        case 'BANK_LETTER':
            rendered = renderBankLetterBody(payload.data);
            break;
        case 'PRE_CONTRACT':
            rendered = renderPreContractBody(payload.data);
            break;
        case 'REMITTANCE_APPROVAL':
            rendered = renderRemittanceBody(payload.data);
            break;
        case 'FREE_BILL_OF_SALE':
            rendered = renderFreeBillBody(payload.data);
            break;
    }

    const fontHead = collectVazirmatnFontCss(options.forStandaloneDownload);
    const docCss = buildDocumentCss(paperSize, showWatermark);

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rendered.title)}</title>
    ${fontHead}
    ${docCss}
</head>
<body>
    <div class="watermark-layer" aria-hidden="true">
        <div class="watermark-text">
            <div class="wm-en">HOSEINI KHODRO</div>
            <div class="wm-sub">KERMAN MOTOR 2606</div>
        </div>
    </div>

    <main class="sheet-wrapper" dir="rtl" lang="fa">
        <div class="doc-content">
            ${rendered.body}

            <footer class="doc-footer">
                <span>${COMPANY_ADDRESS}</span>
                <span>تلفن تماس: ${COMPANY_PHONE_PERSIAN} | سامانه فروش اتولید</span>
            </footer>
        </div>
    </main>
</body>
</html>`;
}
