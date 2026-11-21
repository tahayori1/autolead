/**
 * Dedicated RTL HTML + CSS Print & Preview Builder for ALL 16 KMC Leasing Forms (https://kmc-leasing.ir/)
 * Features:
 *  - Full 8-page Installment Contract (28 articles, 7 notes) matching kmc-leasing.ir exactly
 *  - Supports both Natural Guarantors (2 persons) and Corporate Guarantor (نسخه جدید ضامن شرکتی)
 *  - Covers all 16 official forms: Pre-Registration, Installment Contract, Article 36, Natural/Legal Affidavits,
 *    Peace Contract & Addendum, POA Plate/Mortgage, Natural/Legal/Guarantor Final Info,
 *    Plate Change Commitment, Plate Addendum, Form 15 Check Return, Plate Letter Receipt, and Mortgage Release.
 *  - 100% RTL (dir="rtl" lang="fa"), Vazirmatn typography, A4/A5 support, multi-form batch printing.
 */

import type { DocumentPaperSize } from '../types/bankLetter';
import type {
    LeasingCase,
    LeasingCheckRow,
    LeasingFormId,
    LeasingPeaceParty,
    LeasingPersonInfo
} from '../types/leasing';
import {
    buildFullAddressLine,
    getPersonFullName,
    LEASING_COMPANY_INFO
} from './leasingService';
import {
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from './bankLetterValidation';
import type { DocumentPrintDesignSettings } from '../types/printDesign';
import {
    formatFooterTemplateText,
    getDefaultPrintDesign
} from './printDesignService';
import {
    buildAutoPaginationScript,
    buildPaginationSheetCss
} from './htmlPaginationEngine';

export interface LeasingHtmlPrintOptions {
    paperSize?: DocumentPaperSize;
    showWatermark?: boolean;
    forStandaloneDownload?: boolean;
    forms?: LeasingFormId[];
    design?: DocumentPrintDesignSettings;
}

const COMPANY_PHONE_PERSIAN = '۰۷۱۹۱۶۹۰۹۰۶';

function esc(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
                        if (rule instanceof CSSFontFaceRule && /vazirmatn/i.test(rule.cssText)) {
                            const base = sheet.href || origin;
                            const cssText = rule.cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_m, _q, relUrl) => {
                                if (/^(data:|blob:|https?:)/i.test(relUrl)) return `url("${relUrl}")`;
                                try {
                                    return `url("${new URL(relUrl, base).href}")`;
                                } catch {
                                    return `url("${relUrl}")`;
                                }
                            });
                            faceRules.push(cssText);
                        }
                    }
                } catch {}
            }
        } catch {}
    }

    return `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        ${faceRules.length > 0 ? `<style id="local-vazirmatn-faces">\n${faceRules.join('\n')}\n</style>` : ''}
    `;
}

function buildLeasingCss(
    paperSize: DocumentPaperSize,
    showWatermark: boolean,
    design: DocumentPrintDesignSettings
): string {
    const isA5 = paperSize === 'A5';
    const baseFont = `${design.bodyFontSizePt}pt`;
    const lineHeight = `${design.bodyLineHeight}`;
    const hdrFontPt = design.headerFontSizePt;
    const hdrTitlePt = design.headerTitleFontSizePt;
    const hdrPadPx = design.headerPaddingPx;
    const ftrFontPt = design.footerFontSizePt;
    const ftrPadPx = design.footerPaddingPx;
    const badgeSizePx = Math.max(26, Math.round(hdrFontPt * 4.2));

    const wmFontPt = Math.max(12, Math.min(72, design.watermarkFontSizePt || (isA5 ? 24 : 36)));
    const wmSubFontPt = Math.max(8, Math.round(wmFontPt * 0.45));
    const wmAngle = Number.isFinite(design.watermarkAngleDeg) ? design.watermarkAngleDeg : -18;
    const wmOpacity = Math.max(0.01, Math.min(0.4, design.watermarkOpacity ?? 0.035));
    const isPersianWm = /[\u0600-\u06FF]/.test(design.watermarkText || '');

    return `
    <style>
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
            padding: 16px 10px 28px;
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

        ${buildPaginationSheetCss(paperSize, 'leasing', showWatermark, wmOpacity)}

        .watermark-text {
            transform: rotate(${wmAngle}deg);
            text-align: center;
            font-weight: 900;
            color: #0f172a;
            max-width: 90%;
            line-height: 1.35;
        }
        .watermark-text .wm-en { font-size: ${wmFontPt}pt; letter-spacing: ${isPersianWm ? '0' : '2px'}; }
        .watermark-text .wm-sub { font-size: ${wmSubFontPt}pt; margin-top: 6px; color: #334155; letter-spacing: 0; }

        .doc-content { position: relative; z-index: 1; }

        .l-footer {
            border-top: 1.5px solid #94a3b8;
            padding-top: ${ftrPadPx}px;
            padding-bottom: ${Math.max(0, Math.round(ftrPadPx * 0.25))}px;
            ${design.showFooter ? 'display: flex;' : 'display: none !important;'}
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: ${ftrFontPt}pt;
            line-height: 1.45;
            color: #475569;
            background: #ffffff;
        }

        /* Top Header */
        .l-header {
            ${design.showHeader ? 'display: flex;' : 'display: none !important;'}
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            border-bottom: 2px solid #0f172a;
            padding-top: ${Math.max(0, Math.round(hdrPadPx * 0.35))}px;
            padding-bottom: ${hdrPadPx}px;
            margin-bottom: 8px;
            font-size: ${hdrFontPt}pt;
            line-height: 1.42;
            break-inside: avoid;
        }
        .l-logo-box {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1 1 32%;
        }
        .l-badge {
            width: ${badgeSizePx}px;
            height: ${badgeSizePx}px;
            border-radius: 8px;
            background: linear-gradient(135deg, #b91c1c, #1e293b);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.15em;
            flex-shrink: 0;
        }
        .l-title-box {
            flex: 1 1 42%;
            text-align: center;
        }
        .l-basmala {
            font-size: 1.02em;
            font-weight: 800;
            color: #334155;
        }
        .l-title {
            margin: 0;
            font-size: ${hdrTitlePt}pt;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.35;
        }
        .l-subtitle {
            font-size: 0.87em;
            color: #475569;
            font-weight: 700;
        }
        .l-meta-box {
            flex: 1 1 26%;
            text-align: left;
            font-size: 0.93em;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
        }
        .l-meta-row { white-space: nowrap; }
        .l-meta-lbl { color: #64748b; font-weight: 700; margin-left: 4px; }
        .l-meta-val { color: #0f172a; font-weight: 800; }

        .sec-title {
            background: #f1f5f9;
            border-right: 3.5px solid #1e3a8a;
            padding: 3px 8px;
            font-weight: 900;
            font-size: 0.94em;
            color: #0f172a;
            margin: 6px 0 4px;
            border-radius: 4px;
        }

        .box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: ${isA5 ? '5px 7px' : '7px 10px'};
            margin-bottom: 6px;
            background: #ffffff;
            break-inside: avoid;
        }
        .box-muted { background: #f8fafc; }
        .box-amber { background: #fffbeb; border-color: #fcd34d; }

        p {
            margin: 0 0 5px;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }

        .val { font-weight: 800; color: #0f172a; }
        .val-blue { font-weight: 800; color: #1e3a8a; }
        .val-green { font-weight: 900; color: #065f46; }

        .formula-box {
            background: #f8fafc;
            border: 1.5px dashed #64748b;
            border-radius: 6px;
            padding: 6px 10px;
            margin: 6px auto;
            text-align: center;
            font-weight: 800;
            max-width: 92%;
        }
        .formula-num { border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; margin-bottom: 3px; }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 7px;
            font-size: 0.83em;
        }
        table.data-table th, table.data-table td {
            border: 1px solid #94a3b8;
            padding: ${isA5 ? '2.5px 4px' : '3.5px 6px'};
            text-align: right;
            vertical-align: middle;
        }
        table.data-table th {
            background: #f1f5f9;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
        }
        table.data-table.center th, table.data-table.center td { text-align: center; }
        tr { break-inside: avoid; page-break-inside: avoid; }

        .check-inline {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-left: 14px;
        }
        .chk-sq {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 13px;
            height: 13px;
            border: 1.3px solid #0f172a;
            border-radius: 2px;
            font-size: 8.5pt;
            font-weight: 900;
            background: #fff;
        }

        /* Signature grids */
        .sig-grid {
            display: grid;
            gap: 7px;
            margin-top: 10px;
            padding-top: 7px;
            border-top: 1.5px solid #0f172a;
            break-inside: avoid;
        }
        .sig-grid.c2 { grid-template-columns: repeat(2, 1fr); }
        .sig-grid.c3 { grid-template-columns: repeat(3, 1fr); }
        .sig-grid.c4 { grid-template-columns: repeat(4, 1fr); }

        .sig-cell {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #f8fafc;
            padding: 5px 6px;
            text-align: center;
            min-height: ${isA5 ? '56px' : '68px'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 0.82em;
        }
        .sig-head { font-weight: 900; color: #0f172a; }
        .sig-sub { font-size: 0.9em; color: #475569; }
        .sig-foot { font-size: 0.85em; color: #94a3b8; margin-top: 12px; }

        .page-tag {
            text-align: left;
            font-size: 7.5pt;
            font-weight: 800;
            color: #64748b;
            margin-top: 5px;
        }

        .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    </style>
    `;
}

interface LeasingHeaderOpts {
    basmala?: string;
    title: string;
    subtitle?: string;
    docNumber?: string;
    docDate?: string;
    attachment?: string;
    dealershipCode?: string;
}

function renderCustomizedLeasingHeaderHtml(
    opts: LeasingHeaderOpts,
    design?: DocumentPrintDesignSettings
): string {
    if (design && !design.showHeader) return '';

    const badgeText = design?.headerBadgeText.trim() || 'KMC';
    const companyName = design ? design.headerCompanyName.trim() : 'شرکت واسپاری کرمان موتور';
    const companySub = design
        ? design.headerCompanySub.trim()
        : `نمایندگی ${toPersianDigits(opts.dealershipCode || '2606')} حسینی خودرو شیراز`;
    const extraLine = design ? design.headerExtraLine.trim() : '';
    const basmala = design?.headerBasmala.trim() || opts.basmala || '';
    const finalTitle = design?.headerCustomTitle.trim() || opts.title;
    const finalSubtitle = design?.headerCustomSubtitle.trim() || opts.subtitle || '';
    const encodedOpts = !design ? ` data-hdr-opts="${encodeURIComponent(JSON.stringify(opts))}"` : '';

    return `
        <header class="l-header"${encodedOpts}>
            <div class="l-logo-box">
                <div class="l-badge">${esc(badgeText)}</div>
                <div>
                    ${companyName ? `<div style="font-weight:900; font-size:0.95em; color:#0f172a;">${esc(companyName)}</div>` : ''}
                    ${companySub ? `<div style="font-size:0.78em; color:#475569; font-weight:700;">${esc(companySub)}</div>` : ''}
                    ${extraLine ? `<div style="font-size:0.75em; color:#475569; font-weight:600;">${esc(extraLine)}</div>` : ''}
                </div>
            </div>
            <div class="l-title-box">
                ${basmala ? `<div class="l-basmala">${esc(basmala)}</div>` : ''}
                <h1 class="l-title">${esc(finalTitle)}</h1>
                ${finalSubtitle ? `<div class="l-subtitle">${esc(finalSubtitle)}</div>` : ''}
            </div>
            <div class="l-meta-box">
                ${opts.docNumber ? `<div class="l-meta-row"><span class="l-meta-lbl">شماره:</span><span class="l-meta-val ltr">${esc(toPersianDigits(opts.docNumber))}</span></div>` : ''}
                ${opts.docDate ? `<div class="l-meta-row"><span class="l-meta-lbl">تاریخ:</span><span class="l-meta-val ltr">${esc(toPersianDigits(opts.docDate))}</span></div>` : ''}
                ${opts.attachment ? `<div class="l-meta-row"><span class="l-meta-lbl">پیوست:</span><span class="l-meta-val">${esc(opts.attachment)}</span></div>` : ''}
            </div>
        </header>
    `;
}

function headerBlock(opts: LeasingHeaderOpts): string {
    return renderCustomizedLeasingHeaderHtml(opts);
}

function personSummaryParagraph(label: string, p: LeasingPersonInfo): string {
    const fullName = getPersonFullName(p) || '....................';
    const addr = buildFullAddressLine(p.address) || '........................................';
    return `
        <p style="margin-bottom:4px;">
            ${label ? `<span class="val-blue">${esc(label)}: </span>` : ''}
            <span class="val">${esc(p.title)} ${esc(fullName)}</span>
            فرزند <span class="val">${esc(p.fatherName) || '..........'}</span>
            تاریخ تولد <span class="ltr val">${esc(toPersianDigits(p.birthDate)) || '..........'}</span>
            به شماره شناسنامه <span class="ltr val">${esc(toPersianDigits(p.idNumber)) || '..........'}</span>
            صادره از <span class="val">${esc(p.issuePlace || p.issueCounty) || '..........'}</span>
            با کد ملی <span class="ltr val-blue">${esc(toPersianDigits(p.nationalCode)) || '..............'}</span>
            به نشانی: <span class="val">${esc(addr)}</span>
            کد پستی <span class="ltr val">${esc(toPersianDigits(p.address.postalCode)) || '..............'}</span>
            تلفن ثابت <span class="ltr val">${esc(toPersianDigits(p.address.landlinePhone)) || '............'}</span>
            تلفن همراه <span class="ltr val">${esc(toPersianDigits(p.address.mobilePhone)) || '..............'}</span>
        </p>
    `;
}

function checksTableHtml(rows: LeasingCheckRow[], minRows = 6, firstColLabel = 'مبلغ چک به ریال', dateColLabel = 'تاریخ چک', numColLabel = 'شماره چک'): string {
    const padded = [...rows];
    while (padded.length < minRows) {
        padded.push({
            id: `pad-${padded.length}`,
            amountRials: 0,
            checkDate: '',
            checkNumber: '',
            issuerName: '',
            issuerNationalCode: '',
            bankName: ''
        });
    }
    return `
        <table class="data-table center">
            <thead>
                <tr>
                    <th style="width:7%;">ردیف</th>
                    <th style="width:18%;">${esc(firstColLabel)}</th>
                    <th style="width:13%;">${esc(dateColLabel)}</th>
                    <th style="width:15%;">${esc(numColLabel)}</th>
                    <th style="width:20%;">صادرکننده</th>
                    <th style="width:14%;">کد ملی</th>
                    <th style="width:13%;">بانک</th>
                </tr>
            </thead>
            <tbody>
                ${padded.map((chk, idx) => `
                    <tr>
                        <td>${toPersianDigits(idx + 1)}</td>
                        <td class="ltr val">${chk.amountRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(chk.amountRials))) : ''}</td>
                        <td class="ltr">${chk.checkDate ? esc(toPersianDigits(chk.checkDate)) : ''}</td>
                        <td class="ltr">${chk.checkNumber ? esc(toPersianDigits(chk.checkNumber)) : ''}</td>
                        <td>${esc(chk.issuerName)}</td>
                        <td class="ltr">${chk.issuerNationalCode ? esc(toPersianDigits(chk.issuerNationalCode)) : ''}</td>
                        <td>${esc(chk.bankName)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============================================================================
// 1. فرم پیش ثبت نام
// ============================================================================
function renderPreRegistration(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';
    const cashFmt = c.cashPriceRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials)) : '..............................';
    const cashWords = c.cashPriceRials > 0 ? ` (${numberToPersianWords(c.cashPriceRials)} ریال)` : '';
    const prepayFmt = c.prepaymentRials > 0 ? toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials)) : '..............................';
    const prepayWords = c.prepaymentRials > 0 ? ` (${numberToPersianWords(c.prepaymentRials)} ریال)` : '';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'به نام خدا',
                    title: 'فرم پیش ثبت نام',
                    subtitle: 'مدیریت محترم شرکت واسپاری کرمان موتور',
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="sec-title">مشخصات خریدار</div>
                <div class="box box-muted">
                    <p style="margin:0;">
                        - اینجانب <span class="val-blue">${esc(c.buyer.title)} ${esc(buyerName)}</span>
                        فرزند <span class="val">${esc(c.buyer.fatherName) || '..................'}</span>
                        به شماره ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '....................'}</span>
                        با مدارک شناسایی پیوست، متقاضی خرید یک دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        مدل <span class="val">${esc(toPersianDigits(c.modelYear)) || '........'}</span>
                        رنگ <span class="val">${esc(c.color) || '............'}</span>
                        در نمایندگی <span class="val">${esc(toPersianDigits(c.dealershipCode)) || '۲۶۰۶'}</span> می‌باشم.
                    </p>
                </div>

                <div class="sec-title">نحوه واریز پیش پرداخت</div>
                <div class="box">
                    <p>- ثمن مورد معامله به مبلغ <span class="val-green">${esc(cashFmt)} ریال</span>${esc(cashWords)} مورد تائید اینجانب می‌باشد.</p>
                    <p>- متعهد می‌گردم همزمان با این درخواست، مبلغ <span class="val-blue">${esc(prepayFmt)} ریال</span>${esc(prepayWords)} به عنوان پیش پرداخت به حساب شرکت واسپاری کرمان موتور واریز نمایم.</p>
                    <p style="margin:0;">
                        - الباقی ثمن معامله طی <span class="val">${esc(toPersianDigits(c.installmentsCount))}</span> قسط
                        با تناوب <span class="val">${esc(toPersianDigits(c.installmentIntervalMonths))}</span> ماهه
                        با سود <span class="val">${esc(toPersianDigits(c.annualProfitPercent))}</span> درصد پرداخت می‌گردد.
                    </p>
                </div>

                <div class="sec-title">شرایط انصراف و تایید نمایندگی</div>
                <div class="box box-amber">
                    <p>
                        - چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت واسپاری کرمان موتور مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت یکماه به اینجانب اعاده نماید.
                    </p>
                    <p style="margin:0; font-weight:700;">
                        - صحت امضاء <span class="val-blue">${esc(c.buyer.title)} ${esc(buyerName)}</span>
                        بر روی فرم پیش ثبت نام مورد تأیید نمایندگی شماره <span class="val">${esc(toPersianDigits(c.dealershipCode))}</span> کرمان موتور می‌باشد.
                    </p>
                </div>

                <div class="sig-grid c2" style="margin-top:24px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">امضاء و اثر انگشت متقاضی</div>
                            <div class="sig-sub">${esc(c.buyer.title)} ${esc(buyerName)}</div>
                        </div>
                        <div class="sig-foot">[ محل امضاء و اثر انگشت متقاضی ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">مهر و امضاء نمایندگی</div>
                            <div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div>
                        </div>
                        <div class="sig-foot">[ محل مهر و امضاء رسمی نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 2. قرارداد فروش اقساطی خودرو (۸ صفحه کامل - ۲۸ ماده و ۷ تبصره مطابق kmc-leasing.ir)
// ============================================================================
function renderInstallmentContract(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const g1Name = getPersonFullName(c.guarantor1);
    const g2Name = getPersonFullName(c.guarantor2);
    const lb = c.legalBuyer;
    const cg = c.corporateGuarantor;
    const isCorpGuarantor = c.guarantorMode === 'corporate';

    const remaining = c.remainingAmountRials > 0
        ? c.remainingAmountRials
        : Math.max(0, (c.installmentTotalPriceRials || c.cashPriceRials) - c.prepaymentRials);
    const guarantee120 = c.guarantee120PercentRials > 0
        ? c.guarantee120PercentRials
        : Math.round(remaining * 1.2);

    const legalBuyerHtml = lb.isActive && lb.companyName.trim()
        ? `
            <p style="margin-bottom:0;">
                <span class="val-blue">ب - ۲: شرکت </span><span class="val">${esc(lb.companyName)}</span>
                به شماره ثبت <span class="ltr val">${esc(toPersianDigits(lb.registrationNumber))}</span>
                و شناسه ملی <span class="ltr val">${esc(toPersianDigits(lb.nationalId))}</span>
                ثبت شده در اداره ثبت شرکت‌های <span class="val">${esc(lb.registrationOffice)}</span>
                با شماره اقتصادی <span class="ltr val">${esc(toPersianDigits(lb.economicCode))}</span>
                و به نمایندگی آقایان/خانم‌ها <span class="val">${esc(lb.rep1Name || '........')}</span> بعنوان <span class="val">${esc(lb.rep1Title || '........')}</span>
                و <span class="val">${esc(lb.rep2Name || '........')}</span> بعنوان <span class="val">${esc(lb.rep2Title || '........')}</span>
                صاحبین امضاء مجاز شرکت طبق آخرین تغییرات ثبت شده در روزنامه رسمی شماره <span class="ltr val">${esc(toPersianDigits(lb.gazetteNumber) || '......')}</span> مورخ <span class="ltr val">${esc(toPersianDigits(lb.gazetteDate) || '........')}</span>
                به نشانی: <span class="val">${esc(lb.address)}</span> کد پستی <span class="ltr val">${esc(toPersianDigits(lb.postalCode))}</span> تلفن <span class="ltr val">${esc(toPersianDigits(lb.phone))}</span>
                که از این پس در این قرارداد به اختصار خریدار نامیده می‌شود.
            </p>
        `
        : `
            <p style="margin-bottom:0; color:#475569;">
                <span class="val-blue">ب - ۲: شرکت </span> ........................ به شماره ثبت ................ و شناسه ملی ........................ ثبت شده در اداره ثبت شرکت‌های ............ با شماره اقتصادی ........................ و به نمایندگی آقایان/خانم‌ها .................... بعنوان ............ و .................... بعنوان ............ صاحبین امضاء مجاز شرکت طبق آخرین تغییرات ثبت شده در روزنامه رسمی شماره ............ مورخ ............ به نشانی: ........................................ کد پستی ................ تلفن ................ که از این پس در این قرارداد به اختصار خریدار نامیده می‌شود.
            </p>
        `;

    const guarantorBlockHtml = isCorpGuarantor
        ? `
            <div class="box">
                <div class="val-blue" style="margin-bottom:3px;">ج - ضامن (ضامن شرکتی و حقیقی):</div>
                <p>
                    شرکت <span class="val">${esc(cg.companyName) || '........................'}</span>
                    به شماره ثبت <span class="ltr val">${esc(toPersianDigits(cg.registrationNumber)) || '............'}</span>
                    و شناسه ملی <span class="ltr val">${esc(toPersianDigits(cg.nationalId)) || '................'}</span>
                    ثبت شده در اداره ثبت شرکت‌های <span class="val">${esc(cg.registrationOffice) || '........'}</span>
                    با شماره اقتصادی <span class="ltr val">${esc(toPersianDigits(cg.economicCode)) || '................'}</span>
                    و به نمایندگی آقایان/خانم‌ها <span class="val">${esc(cg.rep1Name) || '............'}</span> بعنوان <span class="val">${esc(cg.rep1Title) || '........'}</span>
                    و <span class="val">${esc(cg.rep2Name) || '............'}</span> بعنوان <span class="val">${esc(cg.rep2Title) || '........'}</span>
                    صاحبین امضاء مجاز شرکت طبق آخرین تغییرات ثبت شده در روزنامه رسمی شماره <span class="ltr val">${esc(toPersianDigits(cg.gazetteNumber)) || '........'}</span> مورخ <span class="ltr val">${esc(toPersianDigits(cg.gazetteDate)) || '........'}</span>
                    به نشانی: <span class="val">${esc(cg.address) || '................................'}</span>
                    کد پستی <span class="ltr val">${esc(toPersianDigits(cg.postalCode)) || '............'}</span>
                    تلفن <span class="ltr val">${esc(toPersianDigits(cg.phone)) || '............'}</span>
                    که از این پس در این قرارداد به اختصار ضامن خریدار نامیده می‌شود.
                </p>
                ${personSummaryParagraph('', c.guarantor1)}
            </div>
        `
        : `
            <div class="box">
                <div class="val-blue" style="margin-bottom:3px;">ج - ضامن:</div>
                ${personSummaryParagraph('ج - ۱', c.guarantor1)}
                ${personSummaryParagraph('ج - ۲', c.guarantor2)}
                <div style="font-size:0.88em; color:#475569;">که از این پس در این قرارداد به اختصار ضامن خریدار نامیده می‌شود.</div>
            </div>
        `;

    const contractFooterSigs = isCorpGuarantor
        ? `
            <div class="sig-grid c3">
                <div class="sig-cell">
                    <div><div class="sig-head">امضاء و اثر انگشت خریدار</div><div class="sig-sub">${esc(buyerName)}</div></div>
                    <div class="sig-foot">[ امضاء / اثر انگشت ]</div>
                </div>
                <div class="sig-cell">
                    <div><div class="sig-head">امضاء صاحبین امضای مجاز و مهر شرکت (ضامن)</div><div class="sig-sub">${esc(cg.companyName) || esc(g1Name) || '..........'}</div></div>
                    <div class="sig-foot">[ مهر و امضاء مجاز ]</div>
                </div>
                <div class="sig-cell">
                    <div><div class="sig-head">امضای فروشنده</div><div class="sig-sub">شرکت واسپاری کرمان موتور</div></div>
                    <div class="sig-foot">[ مهر و امضاء فروشنده ]</div>
                </div>
            </div>
        `
        : `
            <div class="sig-grid c4">
                <div class="sig-cell">
                    <div><div class="sig-head">امضاء و اثر انگشت خریدار</div><div class="sig-sub">${esc(buyerName)}</div></div>
                    <div class="sig-foot">[ امضاء / اثر انگشت ]</div>
                </div>
                <div class="sig-cell">
                    <div><div class="sig-head">امضاء و اثر انگشت ضامن ۱</div><div class="sig-sub">${esc(g1Name) || '..........'}</div></div>
                    <div class="sig-foot">[ امضاء / اثر انگشت ]</div>
                </div>
                <div class="sig-cell">
                    <div><div class="sig-head">امضاء و اثر انگشت ضامن ۲</div><div class="sig-sub">${esc(g2Name) || '..........'}</div></div>
                    <div class="sig-foot">[ امضاء / اثر انگشت ]</div>
                </div>
                <div class="sig-cell">
                    <div><div class="sig-head">امضای فروشنده</div><div class="sig-sub">شرکت واسپاری کرمان موتور</div></div>
                    <div class="sig-foot">[ مهر و امضاء فروشنده ]</div>
                </div>
            </div>
        `;

    const contractSubHeader = (subtitle: string) => headerBlock({
        title: 'قرارداد فروش اقساطی خودرو',
        subtitle,
        docNumber: c.contractNumber,
        docDate: c.contractDate,
        dealershipCode: c.dealershipCode
    });

    // Page 1
    const page1 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'به نام خدا',
                    title: 'قرارداد فروش اقساطی خودرو',
                    subtitle: 'ماده ۱۰ قانون مدنی و دستورالعمل اجرایی شرکت‌های لیزینگ مصوب ۹۵/۱۰/۱۴ شورای پول و اعتبار',
                    docNumber: c.contractNumber,
                    docDate: c.contractDate,
                    dealershipCode: c.dealershipCode
                })}
                <p>
                    این قرارداد به استناد ماده ۱۰ قانون مدنی و همچنین دستورالعمل اجرایی تاسیس، فعالیت و نظارت بر شرکت‌های لیزینگ مصوب ۹۵/۱۰/۱۴ شورای پول و اعتبار فیمابین افراد مشروحه ذیل منعقد و طرفین ملزم به اجرای آن می‌باشند:
                </p>
                <div class="sec-title">ماده ۱ - طرفین قرارداد</div>
                <div class="box box-muted">
                    <p style="margin:0;">
                        <span class="val-blue">الف - فروشنده: </span>
                        ${LEASING_COMPANY_INFO.name} به شماره ثبت <span class="val">${LEASING_COMPANY_INFO.registrationNumber}</span>
                        و به شناسه ملی <span class="val">${LEASING_COMPANY_INFO.nationalId}</span>
                        در اداره ثبت شرکت‌های تهران و شماره اقتصادی <span class="val">${LEASING_COMPANY_INFO.economicCode}</span>
                        با مجوز رسمی از بانک مرکزی با نمایندگی ${LEASING_COMPANY_INFO.representative}
                        به نشانی ${LEASING_COMPANY_INFO.address} تلفن <span class="ltr val">${LEASING_COMPANY_INFO.phone}</span>
                        که از این پس در این قرارداد به اختصار «فروشنده» نامیده می‌شود.
                    </p>
                </div>
                <div class="box">
                    <div class="val-blue" style="margin-bottom:3px;">ب - خریدار / خریداران:</div>
                    ${personSummaryParagraph('ب - ۱', c.buyer)}
                    ${legalBuyerHtml}
                </div>
                ${guarantorBlockHtml}
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۱ از ۸</div>
            </div>
        </section>
    `;

    // Page 2
    const page2 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ماده ۲ تا ۵ — مورد معامله، مدت، نرخ سود و جدول چک‌های اقساط')}
                <div class="sec-title">ماده ۲ - موضوع قرارداد (مورد معامله)</div>
                <div class="box">
                    <p>
                        موضوع قرارداد عبارتست از فروش اقساطی تمامی <span class="val">${esc(toPersianDigits(c.vehicleQuantity || 1))}</span> دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        مدل <span class="val">${esc(toPersianDigits(c.modelYear)) || '......'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        و شماره موتور <span class="ltr val">${esc(c.engineNumber) || '........................'}</span>
                        طبق فاکتور/مبایعه‌نامه <span class="val">${esc(c.invoiceOrBillRef) || '....................'}</span>
                        که تماماً و عیناً به رویت خریدار رسیده و از کمیت و کیفیت و سلامت آن کلاً و کاملاً مطلع می‌باشد صیغه عقد بیع جاری و خریدار اقرار به تحویل مورد معامله بطور صحیح و سالم و با کیفیتی که مورد تقاضای وی بوده است نمود.
                    </p>
                    <p style="margin:0; font-size:0.93em;">
                        <strong>تبصره ۱:</strong> خریدار با توجه به علم و اطلاع کامل از موضوع مورد معامله و امضاء صورتجلسه تحویل، کلیه خیارات متصوره قانونی را خصوصاً خیار عیب و غبن ولو آنکه فاحش باشد را از خود سلب و ساقط نمود و هرگونه ادعا و دعوی از سوی خریدار نسبت به فروشنده قابل طرح نخواهد بود.
                    </p>
                </div>
                <div class="box" style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    <div>
                        <strong class="val-blue">ماده ۳ - مدت قرارداد: </strong>
                        از تاریخ <span class="ltr val">${esc(toPersianDigits(c.contractStartDate)) || '............'}</span>
                        لغایت تاریخ <span class="ltr val">${esc(toPersianDigits(c.contractEndDate)) || '............'}</span>
                        بمدت <span class="val">${esc(toPersianDigits(c.contractDurationMonths))}</span> ماه شمسی است.
                    </div>
                    <div>
                        <strong class="val-blue">ماده ۴ - نرخ سود تسهیلات: </strong>
                        طبق مصوبه شورای پول و اعتبار ابلاغی از سوی بانک مرکزی <span class="val">${esc(toPersianDigits(c.annualProfitPercent))}</span> درصد در سال می‌باشد.
                    </div>
                </div>
                <div class="sec-title">ماده ۵ - مبلغ قرارداد</div>
                <div class="box">
                    <p>
                        قیمت فروش نقدی مورد معامله طبق فاکتور یا اظهارنظر کارشناس رسمی دادگستری که مورد تایید و موافقت خریدار قرار گرفته است مبلغ
                        <span class="val-green">${c.cashPriceRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials))) : '..................'} ریال</span>
                        و قیمت فروش اقساطی مورد معامله با احتساب نرخ سود <span class="val">${esc(toPersianDigits(c.annualProfitPercent))}</span> درصد سالانه به مبلغ
                        <span class="val-green">${c.installmentTotalPriceRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(c.installmentTotalPriceRials))) : '..................'} ریال</span>
                        تعیین گردید که خریدار خرید اقساطی را انتخاب نمود؛ از این رو خریدار متعهد گردید مبلغ
                        <span class="val-blue">${c.prepaymentRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials))) : '..................'} ریال</span>
                        از ثمن مورد معامله را بعنوان پیش پرداخت بصورت نقدی به حساب معرفی شده از سوی فروشنده واریز و فیش واریزی را تحویل فروشنده نماید. همچنین مقرر گردید الباقی ثمن معامله به مبلغ
                        <span class="val-blue">${remaining > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(remaining))) : '..................'} ریال</span>
                        را طی <span class="val">${esc(toPersianDigits(c.installmentsCount))}</span> قسط با تناوب <span class="val">${esc(toPersianDigits(c.installmentIntervalMonths))}</span> ماهه
                        از سوی متقاضی و ضامن با سررسیدهای به شرح ذیل به فروشنده تعهد پرداخت نمایند:
                    </p>
                    ${checksTableHtml(c.checks, Math.min(15, Math.max(6, c.checks.length)))}
                    <p style="margin:0; font-size:0.93em;">
                        <strong>تبصره ۲)</strong> این قرارداد در صورتی اجرایی خواهد شد که خریدار کل مبلغ پیش پرداخت را به حساب معرفی شده از سوی فروشنده واریز نموده باشد.
                    </p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۲ از ۸</div>
            </div>
        </section>
    `;

    // Page 3
    const page3 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ماده ۶ و ۷ — وجه التزام و تضامین و وثائق قرارداد')}
                <div class="sec-title">ماده ۶ - وجه التزام</div>
                <div class="box">
                    <p>
                        چنانچه خریدار در پرداخت مبلغ هر یک از چک‌های فوق‌الذکر تاخیر نماید و وجه چک‌های مزبور به هر دلیل در سررسید مقرر تامین و تادیه نشود و یا با مراجعه به پلیس راهور نسبت به تعویض پلاک بنام خود اقدام ننماید و یا خریدار نسبت به انجام هر یک از تعهدات مندرج در این قرارداد و یا الحاقیه‌های آن تخلف و تخطی نماید، از جمله انجام هر گونه معامله نسبت به مورد قرارداد و یا استفاده غیر مجاز از تسهیلات موضوع این قرارداد، کلیه دیون و بدهی‌های خریدار تبدیل به دین حال شده و خریدار مکلف است علاوه بر وجوه تادیه نشده خود، مبلغی را به عنوان وجه التزام از تاریخ سررسید اقساط یا تبدیل شدن دیون به دین حال، تا روز تسویه بدهی، طبق فرمول ذیل به فروشنده پرداخت نماید:
                    </p>
                    <div class="formula-box">
                        <div class="formula-num">تعداد روزهای تاخیر × (۶ + نرخ سود قرارداد) × مانده اقساط</div>
                        <div>۱۰۰ × تعداد روزهای سال</div>
                    </div>
                    <p style="margin:0; font-size:0.93em;">
                        <strong>تبصره ۳)</strong> مانده بدهی خریدار مندرج در محاسبات فوق عبارتست از مانده اقساط سررسید شده‌ای که خریدار نسبت به پرداخت آن اقدام ننموده است و اقساط سررسید نشده‌ای که به دین حال تبدیل شده است.
                    </p>
                </div>
                <div class="sec-title">ماده ۷ - تضامین و وثائق قرارداد</div>
                <div class="box">
                    <p>خریدار بعنوان تضمین حسن انجام تعهدات ناشی از این قرارداد بشرح ذیل اقدام نمود:</p>
                    <p>
                        <strong>الف -</strong> در صورتیکه مورد معامله قابلیت ترهین را دارا باشد نسبت به ترهین مورد معامله به نفع فروشنده اقدام و سند ترهینی تا تسویه کامل قرارداد نزد فروشنده می‌ماند و پس از تسویه قرارداد نسبت به فک رهن از مورد وثیقه اقدام می‌گردد. و در صورتیکه مورد معامله قابلیت ترهین نداشته باشد خریدار می‌تواند نسبت به ترهین اموال دیگری که قابلیت ترهین داشته باشد اعم از منقول یا غیرمنقول (ملک یا خودرو) بجای مورد معامله به نفع و به صلاحدید فروشنده اقدام نماید بر این اساس:
                    </p>
                    <p>
                        <strong>ب -</strong> نسبت به ارائه یک برگ چک متعلق به خود به میزان ۱۲۰ درصد تسهیلات (اصل + سود به مبلغ
                        <span class="val-blue">${guarantee120 > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(guarantee120))) : '..................'} ریال</span>) به فروشنده اقدام نماید:
                    </p>
                    ${checksTableHtml(c.guaranteeChecks, 4, 'مبلغ چک / سفته به ریال', 'تاریخ چک / سفته', 'شماره چک / سفته')}
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۳ از ۸</div>
            </div>
        </section>
    `;

    // Page 4
    const page4 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ماده ۸ تا ۱۱ — شرایط تضامین، تحویل، هزینه‌های قضایی و فروش مورد معامله')}
                <div class="box">
                    <p><strong class="val-blue">ماده ۸ - شرایط تضامین: </strong>خریدار و ضامن با علم و آگاهی و وقوف کامل راجع به مندرجات این قرارداد و کمیت و کیفیت تعهدات خرید، منفرداً، مشترکاً و متضامناً انجام کلیه تعهدات و پرداخت بدهی‌هایی که در ارتباط با موضوع این قرارداد به عهده خریدار می‌باشد را تعهد نموده و فروشنده به استناد این قرارداد حق دارد علاوه بر مراجعه به خریدار و یا ضامن از آنها، منفرداً و یا مشترکاً ایفای تعهدات قرارداد را مطالبه و وجوه متعلقه را وصول نماید.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۹ - شرایط تحویل و تحول مورد معامله: </strong>مورد معامله پس از قبض و اقباض از سوی فروشنده بصورت کامل و صحیح و سالم تحویل خریدار گردید و خریدار با پذیرش و تایید مسئولیت انتخاب کالای مورد معامله، بعنوان امین فروشنده در این قرارداد مسئولیت حفظ و نگهداری مورد معامله و کلیه هزینه‌های مترتب بر آن و همچنین مسئولیت از بین رفتن آن جزئاً و یا کلاً را بر عهده گرفت.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۱۰ - هزینه‌های دیوانی، دادرسی و قضایی: </strong>هرگاه فروشنده برای وصول مطالبات خود درخواست صدور اجرائیه نماید و یا ناگزیر از توسل به اقدامات قضایی گردد کلیه هزینه‌های اجرایی و دادرسی و حق‌الوکاله وکیل یا نماینده قضایی و خسارت موضوع ماده ۵۱۹ قانون آئین دادرسی مدنی و سایر هزینه‌های مترتبه از هر جهت طبق تشخیص و اعلام فروشنده (شرکت واسپاری کرمان موتور) بر ذمه خریدار بوده که علاوه بر انجام سایر تعهدات، ملزم به پرداخت آن می‌باشد.</p>
                    <p><strong>تبصره ۴ -</strong> خریدار ضمن عقد خارج لازم با تفویض وکالت به فروشنده با حق توکیل به غیر ولو کراراً، حق عزل وکیل، حق ضم امین، حق توکیل بغیر، حق انجام مورد وکالت توسط خود یا ثالث و به طور کلی حق هرگونه رفتاری که منافی با وکالت وکیل باشد را از خود سلب و ساقط نمود. مضافاً فروشنده را وصی بعد از فوت خود با اسقاط حق رجوع قرار داد موارد وکالت و وصایت بشرح ذیل است:</p>
                    <p style="padding-right:12px;">الف – هرگونه وجوهی که پس از سررسید اقساط و یا معوق شدن مطالبات این قرارداد به فروشنده پرداخت گردد، پس از کسر هزینه‌های مندرج در این ماده الباقی بین مانده بدهی اقساط و وجه التزام شامل سود دوران تاخیر و ۶ درصد جریمه دیرکرد تسهیم به نسبت گردد.</p>
                    <p style="padding-right:12px; margin:0;">ب – در صورت تخلف خریدار از شرایط این قرارداد فروشنده حق دارد عندالاقتضاء نسبت به توقیف مورد معامله و هر گونه اقدام دیگری که موجب احقاق حقوق فروشنده باشد اقدام نماید.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۱۱ - فروش مورد معامله: </strong>در طول دوره قرارداد اگر مورد معامله به فروشنده مسترد گردید و یا در صورت فسخ قرارداد و استرداد مورد معامله، خریدار به فروشنده این حق را می‌دهد که مورد معامله را بفروش رسانده و از محل فروش آن بدواً مطالبات خود را وصول نماید و در صورت وجود مبلغ مازاد بر طلب، مبلغ باقیمانده را به خریدار پرداخت نماید و در صورتیکه مبلغ حاصل از فروش مورد معامله کفاف بدهی خریدار به فروشنده را ننماید فروشنده مختار خواهد بود از محل تضمینات و به هر طریق که صلاح بداند نسبت به وصول مطالبات خود اقدام نماید. همچنین فروشنده می‌تواند جهت وصول مطالبات خود طبق مواد ۲ و ۳ قانون نحوه اجرای محکومیت‌های مالی علیه خریدار اقدام نماید.</p>
                    <p style="margin:0;"><strong>تبصره ۵)</strong> در صورت استرداد خودرو مورد معامله، خریدار این حق را به فروشنده می‌دهد که با مراجعه به اداره شماره‌گذاری ناجا نسبت به فک پلاک خریدار اقدام و پلاک معرفی شده خود را منصوب نماید.</p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۴ از ۸</div>
            </div>
        </section>
    `;

    // Page 5
    const page5 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ماده ۱۲ تا ۱۶ — دفاتر قانونی، خدمات پس از فروش، ممنوعیت انتقال و موانع قانونی')}
                <div class="box">
                    <p><strong class="val-blue">ماده ۱۲ - دفاتر قانونی: </strong>دفاتر و صورتحساب‌های مالی فروشنده در هر مورد معتبر و قابل قبول خریدار بوده و تشخیص تخلف از هریک از شرایط و تعهدات و مقررات ناشی از این قرارداد با فروشنده بوده و قطعی و غیرقابل اعتراض می‌باشد. دفاتر و صورتحساب‌های فروشنده از نظر اعلام به مراجع قضایی و یا دفاتر اسناد رسمی و ادارات و دوایر اجرای ثبت جهت صدور اجرائیه یا محاسبات بعدی در جریان عملیات در هر مورد ملاک عمل می‌باشد.</p>
                    <p style="margin:0;"><strong>تبصره ۶ - خدمات پس از فروش: </strong>درصورتیکه خودرو مورد معامله نیازمند خدمات پس از فروش باشد از زمان تحویل مورد معامله به خریدار تابع شرایط شرکت سازنده یا واردکننده مورد معامله بوده و فروشنده در این خصوص مسئولیتی بر عهده ندارد و در صورتیکه مورد معامله تحویلی به خریدار دارای ایراد و نقص فنی باشد و از این بابت خسارتی به خریدار وارد گردد شرکت سازنده یا واردکننده مورد معامله مسئول پرداخت کلیه خسارات وارده به خریدار می‌باشد ضمناً خریدار نمی‌تواند به دلیل نقص فنی مورد معامله از پرداخت بدهی خود استنکاف ورزد.</p>
                </div>
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۱۳ - انتقال حقوق مورد معامله: </strong>خریدار تا پایان مدت این قرارداد و قبل از تسویه کامل کلیه بدهی‌ها و دیون خود به (تشخیص فروشنده)، حق واگذاری هرنوع حقی از حقوق خود نسبت به عین یا منافع مورد معامله و انجام هرگونه معامله از هر حیث و هر جهت و تحت هر عنوان اعم از قطعی و شرطی و رهنی و صلح حقوق، اجاره، اقرار، شرکت، وکالت، قرارداد وصایت و غیره را در خصوص مورد معامله نسبت به اصل یا مازاد آن از خود صریحاً سلب و ساقط نمود. در صورت کشف هر نوع معامله مذکور در این بند، خریدار قبول نمود که معامله انجام شده باطل و کان لم یکن بوده و شخصاً در برابر طرف معامله خود پاسخگو بوده و فروشنده نیز می‌تواند باقیمانده دیون را دفعتاً واحده از بدهکار یا از محل تضامین این قرارداد وصول نماید. تشخیص انجام معامله با غیر، با فروشنده بوده و این تشخیص قطعی و غیرقابل اعتراض می‌باشد.</p>
                </div>
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۱۴ - </strong>خریدار متعهد است کلیه مقررات و قوانین مربوط به مورد معامله را در رابطه با حقوق مادی و معنوی اشخاص حقیقی و حقوقی رعایت نماید و فروشنده از هرگونه تعهد و مسئولیتی در این موارد مبرا می‌باشد.</p>
                </div>
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۱۵ - موانع قانونی معامله: </strong>خریدار اقرار و اعتراف نمود که کلیه مجوزهای لازم جهت انتقال مورد معامله را دارا بوده و انجام معامله به لحاظ قوانین و مقررات موجود کشور بلامانع است. در صورتیکه خریدار تحت هر یک از عناوین مندرج در قانون مدنی اختیار و اهلیت انجام معامله را نداشته باشد یا ممنوع‌المعامله باشد و مراتب را قبلاً به اطلاع فروشنده نرسانده باشد، چنانچه در نتیجه این اقدام ضرری متوجه فروشنده گردد مکلف به پاسخگویی و جبران خسارات وارده می‌باشد.</p>
                </div>
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۱۶ - تعهدات خریدار به اشخاص ثالث: </strong>تعهدات خریدار در قبال اشخاص و مراجع ذیربط، ارتباطی به این قرارداد ندارد لذا در صورتیکه از ناحیه طلبکاران یا مراجع یاد شده اقدامی در جهت توقیف مورد معامله صورت گیرد خریدار ملزم به پاسخگویی و عنداللزوم جبران خسارات و رفع اثر از توقیف آن می‌باشد. بدیهی است تاخیرات حاصله در پرداخت اقساط موثر نبوده و خریدار مکلف به پرداخت آن در سررسیدهای تعیین شده می‌باشد.</p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۵ از ۸</div>
            </div>
        </section>
    `;

    // Page 6
    const page6 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ماده ۱۷ و ۱۸ — کاپوتاژ و شرایط بیمه مورد معامله')}
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۱۷ - کاپوتاژ: </strong>در صورتیکه خریدار قصد خارج نمودن موقت خودرو مورد معامله را از کشور داشته باشد و خودرو مذکور در رهن فروشنده باشد به منظور اخذ موافقت فروشنده، خریدار بایستی بدواً موافقت بیمه‌گر خودرو مورد معامله به همراه پوشش اضافی بیمه خودرو مذکور را اخذ نموده و سپس نسبت به تامین تضامین لازم و درخواستی فروشنده اقدام نماید.</p>
                </div>
                <div class="sec-title">ماده ۱۸ - بیمه مورد معامله</div>
                <div class="box">
                    <p><strong>۱۸-۱-</strong> خریدار تعهد نمود مورد معامله را تا اتمام دوره قرارداد و تسویه حساب نهایی به مبالغ اعلامی از سوی فروشنده در برابر آتش‌سوزی، انفجار، سرقت، زلزله، سیل، صاعقه و سایر خطرات احتمالی نزد یکی از شرکت‌های بیمه مورد وثوق فروشنده، به هزینه خود و بنفع فروشنده بیمه نماید و اصل بیمه‌نامه را به فروشنده ارائه نماید. همچنین خریدار مکلف است در صورت بروز خسارت به مورد بیمه شده سریعاً مراتب را به بیمه‌گر و فروشنده اطلاع دهد.</p>
                    <p><strong>تبصره ۷:</strong> در صورتیکه خریدار از بیمه نمودن مورد معامله این قرارداد امتناع ورزد فروشنده اختیار دارد وکالتاً از طرف خریدار نسبت به بیمه نمودن مورد معامله اقدام نماید و مبلغ هزینه شده را از خریدار مطالبه نماید و یا به حساب بدهی وی منظور نماید.</p>
                    <p><strong>۱۸-۲-</strong> خریدار ضمن عقد خارج لازم، ملتزم و متعهد می‌شود کلیه خساراتی را که به هر دلیل از جمله موارد غیرارادی و فورس ماژور به مورد معامله و به اشخاص ثالث در ارتباط با مورد معامله وارد آید جبران نماید.</p>
                    <p><strong>۱۸-۳-</strong> چنانچه خریدار در پایان مدت قرارداد نسبت به تسویه حساب و انتقال مورد معامله اقدامی ننماید، فروشنده اختیار دارد در صورت صلاحدید کماکان مورد معامله را نزد یکی از شرکت‌های بیمه‌ای طرف قرارداد خود بیمه نموده و هزینه آنرا به حساب بدهی خریدار منظور نماید.</p>
                    <p><strong>۱۸-۴-</strong> خریدار مکلف است از شرکت بیمه‌گر بخواهد که نکات مندرج در ذیل را با رعایت مقررات و ضوابط، در بیمه‌نامه صادره درج نماید: الف - ذینفع بیمه‌نامه فروشنده است. ب - صدور هر الحاقیه فقط با تایید کتبی فروشنده امکان‌پذیر می‌باشد. ج - پرداخت خسارت فقط در وجه فروشنده انجام می‌پذیرد و به نماینده فروشنده تسلیم می‌گردد.</p>
                    <p><strong>۱۸-۵-</strong> خریدار مکلف است هر حادثه مهم را که می‌تواند منجر به خسارتی گردد و یا منجر به خسارتی گردیده است ضمن اطلاع به شرکت بیمه‌گر حداکثر ظرف یک هفته از تاریخ حادثه، به فروشنده نیز اطلاع دهد.</p>
                    <p><strong>۱۸-۶-</strong> خسارت پرداخت شده به فروشنده (موضوع بند ج-۴-۱۸)، از طرف شرکت بیمه، پس از دریافت و رسیدگی به وضعیت بدهی خریدار و حصول اطمینان از وصول کلیه مطالبات، به خریدار پرداخت می‌شود. بدیهی است در صورت وجود هرگونه بدهی خریدار به فروشنده بدواً بدهی مربوطه تسویه می‌گردد و در صورت باقیماندن وجهی از پرداختی بیمه‌گر، به خریدار پرداخت می‌گردد.</p>
                    <p><strong>۱۸-۷-</strong> خریدار مکلف است هرگونه تغییر کاربردی در مورد معامله را جهت اصلاح تعهدات بیمه‌ای به فروشنده اعلام نماید، در غیر اینصورت در صورت بروز هر گونه حادثه و عدم پوشش بیمه‌گر، جبران خسارت وارده به عهده خریدار بوده و فروشنده در این خصوص هیچ مسئولیتی ندارد.</p>
                    <p style="margin:0;"><strong>۱۸-۸-</strong> خریدار متعهد است مابه‌التفاوت احتمالی ناشی از تغییر تعرفه بیمه مرکزی را از بابت بیمه مورد معامله بپردازد.</p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۶ از ۸</div>
            </div>
        </section>
    `;

    // Page 7
    const page7 = `
        <section class="form-sheet page-break-after">
            <div class="doc-content">
                ${contractSubHeader('ادامه ماده ۱۸ و مواد ۱۹ تا ۲۲ — هزینه‌ها، اقامتگاه، فسخ و مبارزه با پولشویی')}
                <div class="box">
                    <p><strong>۱۸-۹-</strong> خریدار متعهد است هر زمان که مورد معامله باید به رویت فروشنده یا شرکت بیمه رسانده شود حداکثر ظرف یک هفته پس از اعلام کتبی فروشنده، مورد معامله را به رویت فروشنده یا شرکت بیمه برساند.</p>
                    <p style="margin:0;"><strong>۱۸-۱۰-</strong> در مواردی که مورد معامله سرقت می‌شود و یا کاملاً تلف می‌گردد با توجه به عدم وجود مورد معامله، خریدار مکلف به تسویه کامل بدهی حال و آینده خود خواهد بود و فروشنده چک خسارت کلی بیمه را وصول و از محل آن نسبت به تسویه حساب بدهی خریدار اقدام می‌نماید.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۱۹ - </strong>خریدار متعهد و ملتزم است نسبت به پرداخت کلیه هزینه‌های نقل و انتقال از جمله مالیات‌های متعلقه و عوارض مربوطه و هزینه‌های مرتبط با دفتر اسناد رسمی، بدون هیچگونه تعللی در زمان مقرر اقدام نماید.</p>
                    <p style="margin:0;"><strong class="val-blue">ماده ۲۰ - اقامتگاه: </strong>چنانچه خریدار و ضامنین وی نشانی پستی و یا تلفن‌های خود را تغییر دهند باید موضوع را به صورت کتبی به فروشنده اعلام نمایند مادامیکه تغییر موارد فوق کتباً به فروشنده اعلام نشده باشد، کلیه مکاتبات، مراسلات و ابلاغیه‌ها و اخطاریه‌های اجرایی و غیره حسب مورد از طریق پیامک و نشانی پستی که در ماده یک این قرارداد ذکر شده ابلاغ شده تلقی می‌گردد.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۲۱ - فسخ قرارداد: </strong>فروشنده می‌تواند به تشخیص خود که قطعی و غیرقابل اعتراض می‌باشد و در صورت تحقق هریک از موارد زیر، قرارداد را با اظهارنامه رسمی به اقامتگاه قانونی خریدار فسخ نماید:</p>
                    <p style="padding-right:10px;">۲۱-۱ – خریدار هریک از اقساط ماهانه را به موقع نپرداخته باشد. | ۲۱-۲ – خریدار هریک از تعهدات قرارداد را به تشخیص فروشنده نقض کرده باشد.</p>
                    <p style="padding-right:10px;">۲۱-۳ – در صورتیکه به هر دلیل استفاده از تضامین ماخوذه برای فروشنده میسر نگردد. | ۲۱-۴ – واگذاری کلی یا جزئی حقوق قرارداد بدون اطلاع و موافقت فروشنده به غیر.</p>
                    <p style="padding-right:10px;">۲۱-۵ – از دست دادن پروانه و امتیاز استفاده از مورد معامله یا انتقال یا توقف و ورشکستگی. | ۲۱-۶ – فوت یا حجر خریدار و عدم تعیین تکلیف از سوی وراث یا قائم‌مقام قانونی.</p>
                    <p style="padding-right:10px; margin:0;">۲۱-۷ – در صورت تقاضای فسخ قرارداد و تسویه اقساط آتی توسط خریدار، چنانچه فروشنده با فسخ قرارداد موافقت نماید در این صورت فروشنده موظف می‌باشد در ارتباط با وصول مبالغ اقساط آتی، تعدیل لازم را با توجه به دستورالعمل‌ها و آیین‌نامه‌های ابلاغی بانک مرکزی اعمال نماید.</p>
                </div>
                <div class="box">
                    <p style="margin:0;"><strong class="val-blue">ماده ۲۲ - </strong>خریدار و ضامن با توجه به مفاد ۲ و ۹ قانون مبارزه با پول‌شویی مصوب ۱۳۹۷/۰۷/۰۳ مجلس شورای اسلامی و آیین‌نامه و دستورالعمل‌های اجرایی آن بدین وسیله متعهد و ملتزم می‌شوند ضمن رعایت قانون یاد شده و مقررات مربوطه از هر گونه اقدامی که منجر به پولشویی گردد خودداری نموده و همچنین به اشخاص ثالث اجازه استفاده از حساب‌ها و خدمات بانکی و ابزارهای بانکداری الکترونیکی خود را نداده و اعلام می‌نمایند اطلاعات ارائه شده بر اساس آخرین تغییرات می‌باشد و بعلاوه متعهد می‌شوند هر گونه تغییر در کد و نشانی پستی/ثبتی را به مراجع قانونی ذیربط اطلاع داده و مستندات تغییرات را به فروشنده ارائه نمایند. خریدار و ضامن معرفی شده با امضاء ذیل این قرارداد اقرار می‌نمایند که متن فوق را مطالعه نموده و مندرجات آن دقیقاً به ایشان تفهیم شده است.</p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۷ از ۸</div>
            </div>
        </section>
    `;

    // Page 8
    const page8 = `
        <section class="form-sheet">
            <div class="doc-content">
                ${contractSubHeader('ماده ۲۳ تا ۲۸ — اقرارنامه، حل اختلاف، قوه قاهره، استعلام اعتباری و نسخ قرارداد')}
                <div class="box">
                    <p><strong class="val-blue">ماده ۲۳ - اقرارنامه: </strong>متقاضی اقرار می‌نماید که یک دستگاه خودرو با مشخصات ماده ۲ قرارداد را از فروشنده خریداری نموده است فلذا نسبت به تفاوت قیمت احتمالی فروش و قیمت درج شده به روی سند و فاکتور فروش خودرو اطلاع کامل داشته و پرداختی را با رضایت کامل و اراده واقعی به حساب فروشنده واریز نموده است و هیچ گونه اعتراضی به مبلغ پرداختی معارض با بهای مندرج در فاکتور و سند فروش فوق‌الذکر نداشته و هرگونه ادعایی را در آینده در مورد اضافه پرداختی از خود ساقط می‌نماید.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۲۴ - حل اختلاف: </strong>در صورت بروز اختلاف فیمابین فروشنده و خریدار در خصوص مفاد مواد این قرارداد و نحوه تفسیر یا اجرای آن بدواً طرفین سعی می‌نمایند موضوع را از طریق مذاکره حل و فصل نمایند در صورت عدم توافق هر یک از طرفین قرارداد می‌تواند موضوع را از طرق قانونی یا قضایی مورد پیگیری قرار دهد.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۲۵ - حوادث قهری: </strong>بروز حوادث قهری مانع از عدم انجام تعهدات خریدار نمی‌باشد و تعهدات خریدار به قوت خود باقی می‌باشد مگر اینکه با موافقت فروشنده انجام تعهدات برای مدت زمان توافقی به عهده تعویق بیفتد.</p>
                    <p style="margin:0;"><strong class="val-blue">ماده ۲۶ - فورس ماژور (قوه قاهره): </strong>چنانچه بر اثر شرایط تحریمی کشور، در اثر عدم واردات قطعات شرکت در تحویل خودروها با تاخیر مواجه شود هیچگونه مسئولیتی متوجه شرکت واسپاری کرمان موتور نمی‌باشد.</p>
                </div>
                <div class="box">
                    <p><strong class="val-blue">ماده ۲۷: </strong>خریدار با امضاء این قرارداد به فروشنده اذن می‌دهد اطلاعات اعتباری و هویتی وی را در اختیار شرکت مشاوره رتبه‌بندی اعتباری ایران و سایر بانک‌ها و لیزینگ‌ها و موسسات مالی و اعتباری و مراکز و نهادهای ذیصلاح قرار دهد و یا از اطلاعات اعتباری و هویتی خریدار در بانک‌ها و موسسات مالی و اعتباری و سایر نهادهای ذیصلاح استفاده نماید.</p>
                    <p style="margin:0;"><strong class="val-blue">ماده ۲۸ - نسخ قرارداد: </strong>این قرارداد در تاریخ <span class="ltr val">${esc(toPersianDigits(c.contractDate)) || '............'}</span> طبق قوانین کشور جمهوری اسلامی ایران در ۲۷ ماده و ۷ تبصره و در سه نسخه تهیه و تنظیم گردید و به رویت و امضای فروشنده، خریدار و ضامن رسید که هر سه نسخه حکم واحد را دارد و ایشان ضمن اقرار به اطلاع و آگاهی کامل از مفاد این قرارداد و پذیرش تبعات حقوقی و قانونی آن در اقامتگاه قانونی فروشنده مبادرت به امضای تمامی صفحات آن نمودند.</p>
                </div>
                ${contractFooterSigs}
                <div class="page-tag">صفحه ۸ از ۸</div>
            </div>
        </section>
    `;

    return page1 + page2 + page3 + page4 + page5 + page6 + page7 + page8;
}

// ============================================================================
// 3. فرم ماده ۳۶ دستورالعمل اجرائی تاسیس، نحوه فعالیت و نظارت بر شرکت‌های لیزینگ
// ============================================================================
function renderArticle36Form(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const remaining = c.remainingAmountRials > 0
        ? c.remainingAmountRials
        : Math.max(0, (c.installmentTotalPriceRials || c.cashPriceRials) - c.prepaymentRials);
    const totalPrincipalAndInterest = c.article36FacilityTotalRials > 0
        ? c.article36FacilityTotalRials
        : Math.max(0, (c.installmentTotalPriceRials || c.cashPriceRials) - c.prepaymentRials);
    const guarantee120 = c.article36ObligationCheckRials > 0
        ? c.article36ObligationCheckRials
        : (c.guarantee120PercentRials > 0 ? c.guarantee120PercentRials : Math.round(remaining * 1.2));

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'فرم ماده ۳۶ دستورالعمل اجرائی',
                    subtitle: 'تاسیس، نحوه فعالیت و نظارت بر شرکت‌های لیزینگ',
                    docNumber: c.contractNumber,
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="font-size:0.95em; line-height:1.85;">
                    <p><strong>۱)</strong> مبلغ اصل و فرع تسهیلات <span class="val-green">${totalPrincipalAndInterest > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(totalPrincipalAndInterest))) : '..................'} ریال</span> می‌باشد و مبلغ تسهیلات <span class="val-blue">${remaining > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(remaining))) : '..................'} ریال</span> می‌باشد که در قرارداد نیز آمده است.</p>
                    <p><strong>۲)</strong> نرخ سود تسهیلات اعطائی (مصوب شورای پول و اعتبار) به میزان <span class="val">${esc(toPersianDigits(c.annualProfitPercent))}</span> درصد می‌باشد.</p>
                    <p><strong>۳)</strong> قیمت نقدی فروش <span class="val-green">${c.cashPriceRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(c.cashPriceRials))) : '..................'} ریال</span> می‌باشد.</p>
                    <p><strong>۴)</strong> میزان پیش دریافت مبلغ <span class="val-blue">${c.prepaymentRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(c.prepaymentRials))) : '..................'} ریال</span> می‌باشد و در قرارداد نیز قید شده است.</p>
                    <p><strong>۵)</strong> در صورت انصراف قبل از تحویل کالا ۱٪ از مبلغ پیش پرداخت به صورت روزانه تا زمان اعلام انصراف توسط متقاضی بابت هزینه‌های انجام شده کسر شده و الباقی وجه به متقاضی عودت می‌گردد و در صورتی که متقاضی از تحویل کالا امتناع نماید بر طبق قرارداد اقدامات لازم انجام می‌گیرد.</p>
                    <p><strong>۶)</strong> تابع PMT مبنای محاسبه اقساط می‌باشد.</p>
                    <p><strong>۷)</strong> نحوه محاسبه مال‌الاجاره در صورت تنظیم قرارداد بصورت اجاره بشرط تملیک به تفصیل در قرارداد آمده است.</p>
                    <p><strong>۸)</strong> تاریخ تحویل خودرو مورد درخواست بر اساس امکانات شرکت سازنده (تامین‌کننده) می‌باشد و شرکت واسپاری کرمان موتور در قبال افزایش زمان انتظار و تاخیر در تحویل خودروی مورد درخواست هیچگونه خسارتی به متقاضی پرداخت نخواهد کرد.</p>
                    <p><strong>۹)</strong> زمان و نحوه انتقال مالکیت خودرو به مشتری در قرارداد به تفصیل قید شده است.</p>
                    <p><strong>۱۰)</strong> ارائه تسهیلات تا سقف معین با اخذ ضامن اعطاء می‌گردد و یک فقره چک از متقاضی به مبلغ <span class="val-blue">${guarantee120 > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(guarantee120))) : '..................'} ریال</span> بعنوان تعهدات مندرج در قرارداد اخذ می‌گردد و همچنین در صورت واگذاری اجاره بشرط تملیک نیز سند به نام شرکت واسپاری کرمان موتور و پلاک خودرو به نام مشتری صادر شده و سند تا پایان اقساط نزد شرکت باقی می‌ماند.</p>
                    <p><strong>۱۱)</strong> ارائه تسهیلات بالاتر از سقف معین صرفاً با اخذ وثیقه ملکی سهل‌البیع انجام می‌شود.</p>
                    <p><strong>۱۲)</strong> نحوه محاسبه خسارت ناشی از عدم ایفای تعهد دین در قرارداد شرح داده شده است.</p>
                    <p style="margin:0;"><strong>۱۳)</strong> در صورت شکایت و اعتراض، متقاضی می‌تواند با شماره تلفن <span class="ltr val">${LEASING_COMPANY_INFO.complaintPhone}</span> تماس بگیرد و یا به نشانی وب سایت شرکت <span class="ltr val">${LEASING_COMPANY_INFO.website}</span> مراجعه نماید و یا اینکه شکایت خود را از طریق فکس به شرکت منعکس نماید.</p>
                </div>

                <div class="box box-amber">
                    <p style="margin:0; font-weight:700;">
                        اینجانب <span class="val-blue">${esc(buyerName)}</span> با اطلاع و قبول کلیه شرایط اعطایی تسهیلات اعلام می‌دارم در خصوص کلیه موارد بالا توضیحات کافی و وافی به اینجانب ارائه شده و اینجانب کلیه مفاد بالا را قبول داشته و حق هرگونه دادخواهی، اعلام دعوی و مطالبه خسارت و صدمه ناشی از عدم اطلاع از موارد فوق را از خود سلب می‌نمایم.
                    </p>
                </div>

                <div class="sig-grid c2">
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">امضاء و اثر انگشت متقاضی</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت متقاضی ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">مهر و امضاء شرکت واسپاری کرمان موتور</div><div class="sig-sub">نمایندگی ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 4. اقرارنامه اشخاص حقیقی & 5. اقرارنامه اشخاص حقوقی
// ============================================================================
function renderNaturalAffidavit(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const payerName = c.naturalPayer.fullName.trim() || buyerName;
    const payerFather = c.naturalPayer.fatherName.trim() || c.buyer.fatherName || '..........';
    const payerNc = c.naturalPayer.nationalCode.trim() || c.buyer.nationalCode || '..............';
    const amt = c.affidavitAmountRials || c.prepaymentRials;
    const amtNum = amt > 0 ? toPersianDigits(formatCurrencyWithCommas(amt)) : '..............................';
    const amtWords = amt > 0 ? numberToPersianWords(amt) : '............................................................';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'اقرارنامه اشخاص حقیقی',
                    subtitle: 'تایید واریز وجه به شرکت واسپاری کرمان موتور',
                    docNumber: c.contractNumber,
                    docDate: c.affidavitDepositDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="padding:18px 16px; font-size:1.05em; line-height:2.35; margin-top:14px;">
                    <p style="margin:0;">
                        اینجانب <span class="val-blue">${esc(payerName)}</span>
                        فرزند <span class="val">${esc(payerFather)}</span>
                        به کد ملی <span class="ltr val-blue">${esc(toPersianDigits(payerNc))}</span>
                        به موجب این سند اقرار می‌نمایم که در تاریخ <span class="ltr val">${esc(toPersianDigits(c.affidavitDepositDate)) || '............'}</span>
                        مبلغ به عدد <span class="val-green">${esc(amtNum)} ریال</span>
                        و مبلغ به حروف <span class="val-green">${esc(amtWords)} ریال</span>
                        را به شرکت واسپاری کرمان موتور جهت ثبت نام یکدستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        و شماره موتور <span class="ltr val">${esc(c.engineNumber) || '........................'}</span>
                        مدل <span class="val">${esc(toPersianDigits(c.modelYear)) || '......'}</span>
                        به رنگ <span class="val">${esc(c.color) || '..........'}</span>
                        با شماره قرارداد <span class="ltr val">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        به طرفیت آقای/خانم <span class="val-blue">${esc(buyerName)}</span>
                        فرزند <span class="val">${esc(c.buyer.fatherName) || '..........'}</span>
                        به کد ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '..............'}</span>
                        واریز نموده‌ام و هیچ گونه اعتراض و ادعایی به مبلغ واریزی فوق‌الذکر ندارم.
                    </p>
                </div>

                <div style="text-align:center; font-size:0.9em; color:#475569; margin:12px 0;">
                    جهت تایید اقرارنامه، امضاء متقاضی و واریزکننده به تایید نمایندگی می‌رسد.
                </div>

                <div class="sig-grid c3" style="margin-top:26px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام و نام خانوادگی متقاضی</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام و نام خانوادگی واریزکننده</div><div class="sig-sub">${esc(payerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">مهر و امضاء نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderLegalAffidavit(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const coName = c.legalPayer.companyName.trim() || c.legalBuyer.companyName.trim() || '........................';
    const coReg = c.legalPayer.registrationNumber.trim() || c.legalBuyer.registrationNumber.trim() || '............';
    const coNid = c.legalPayer.nationalId.trim() || c.legalBuyer.nationalId.trim() || '................';
    const amt = c.affidavitAmountRials || c.prepaymentRials;
    const amtNum = amt > 0 ? toPersianDigits(formatCurrencyWithCommas(amt)) : '..............................';
    const amtWords = amt > 0 ? numberToPersianWords(amt) : '............................................................';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'اقرارنامه اشخاص حقوقی',
                    subtitle: 'تایید واریز وجه توسط شخص حقوقی به شرکت واسپاری کرمان موتور',
                    docNumber: c.contractNumber,
                    docDate: c.affidavitDepositDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="padding:18px 16px; font-size:1.05em; line-height:2.35; margin-top:14px;">
                    <p style="margin:0;">
                        شرکت <span class="val-blue">${esc(coName)}</span>
                        به شماره ثبت <span class="ltr val">${esc(toPersianDigits(coReg))}</span>
                        و شناسه ملی <span class="ltr val-blue">${esc(toPersianDigits(coNid))}</span>
                        به موجب این سند اقرار می‌نماید که در تاریخ <span class="ltr val">${esc(toPersianDigits(c.affidavitDepositDate)) || '............'}</span>
                        مبلغ به عدد <span class="val-green">${esc(amtNum)} ریال</span>
                        و مبلغ به حروف <span class="val-green">${esc(amtWords)} ریال</span>
                        را به شرکت واسپاری کرمان موتور جهت ثبت نام یکدستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        و شماره موتور <span class="ltr val">${esc(c.engineNumber) || '........................'}</span>
                        مدل <span class="val">${esc(toPersianDigits(c.modelYear)) || '......'}</span>
                        به رنگ <span class="val">${esc(c.color) || '..........'}</span>
                        با شماره قرارداد <span class="ltr val">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        به طرفیت آقای/خانم <span class="val-blue">${esc(buyerName)}</span>
                        فرزند <span class="val">${esc(c.buyer.fatherName) || '..........'}</span>
                        به کد ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '..............'}</span>
                        واریز نموده است و هیچ گونه اعتراض و ادعایی به مبلغ واریزی فوق‌الذکر ندارد.
                    </p>
                </div>

                <div style="text-align:center; font-size:0.9em; color:#475569; margin:12px 0;">
                    جهت تایید اقرارنامه، امضاء متقاضی و واریزکننده به تایید نمایندگی می‌رسد.
                </div>

                <div class="sig-grid c3" style="margin-top:26px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام و نام خانوادگی متقاضی</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام شرکت واریزکننده</div><div class="sig-sub">${esc(coName)}</div></div>
                        <div class="sig-foot">[ امضاء صاحبان مجاز و مهر شرکت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">مهر و امضاء نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 6. صلحنامه واسپاری & 7. متمم صلحنامه
// ============================================================================
function peacePartyTableHtml(party: LeasingPeaceParty, roleLabel: string, legalFallbackCompany?: { name: string; reg: string; addr: string }): string {
    const legalName = party.isLegal ? party.legalName : (legalFallbackCompany?.name || '');
    const legalReg = party.isLegal ? party.legalRegNumber : (legalFallbackCompany?.reg || '');
    const legalAddr = party.isLegal ? party.legalAddress : (legalFallbackCompany?.addr || '');

    return `
        <table class="data-table center" style="margin-bottom:6px;">
            <thead>
                <tr>
                    <th colspan="7" style="background:#e2e8f0; text-align:right;">${esc(roleLabel)}</th>
                </tr>
                <tr>
                    <th>نام خانوادگی</th>
                    <th>نام</th>
                    <th>نام پدر</th>
                    <th>شماره شناسنامه</th>
                    <th>صادره</th>
                    <th>تاریخ تولد</th>
                    <th>تاریخ صدور</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="val">${esc(party.lastName) || '-'}</td>
                    <td class="val">${esc(party.firstName) || '-'}</td>
                    <td>${esc(party.fatherName) || '-'}</td>
                    <td class="ltr">${esc(toPersianDigits(party.idNumber)) || '-'}</td>
                    <td>${esc(party.issuePlace) || '-'}</td>
                    <td class="ltr">${esc(toPersianDigits(party.birthDate)) || '-'}</td>
                    <td class="ltr">${esc(toPersianDigits(party.idIssueDate)) || '-'}</td>
                </tr>
                <tr>
                    <th>کد ملی</th>
                    <td colspan="2" class="ltr val-blue">${esc(toPersianDigits(party.nationalCode)) || '-'}</td>
                    <th>کد پستی</th>
                    <td class="ltr">${esc(toPersianDigits(party.postalCode)) || '-'}</td>
                    <th>تلفن همراه</th>
                    <td class="ltr">${esc(toPersianDigits(party.mobilePhone)) || '-'}</td>
                </tr>
                <tr>
                    <th>شخصیت حقوقی</th>
                    <td colspan="2" class="val">${esc(legalName) || '-'}</td>
                    <th>شماره ثبت</th>
                    <td class="ltr">${esc(toPersianDigits(legalReg)) || '-'}</td>
                    <th>نشانی</th>
                    <td>${esc(legalAddr) || '-'}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function renderLeasingPeaceContract(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const mosName = c.mosaleh.isLegal
        ? c.mosaleh.legalName
        : ([c.mosaleh.firstName, c.mosaleh.lastName].filter(Boolean).join(' ') || '....................');
    const motName = c.motasaleh.isLegal
        ? c.motasaleh.legalName
        : ([c.motasaleh.firstName, c.motasaleh.lastName].filter(Boolean).join(' ') || buyerName);

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: 'صلحنامه',
                    subtitle: 'شرکت واسپاری کرمان موتور — انتقال حقوق ثبت‌نام',
                    docNumber: c.peaceNumber,
                    docDate: c.peaceDate,
                    dealershipCode: c.dealershipCode
                })}

                ${peacePartyTableHtml(c.motasaleh, 'مشخصات طرف صلح (متصالح / انتقال‌گیرنده)')}

                <div class="box box-muted" style="font-size:0.93em;">
                    <p style="margin:0;">
                        این صلحنامه در محل نمایندگی و با حضور انتقال‌دهنده و انتقال‌گیرنده، شهود شامل نمایندگی مجاز
                        <span class="val-blue">${esc(c.dealershipName)}</span>
                        و آقای/خانم <span class="val">${esc(c.peaceWitness.name) || '..................'}</span>
                        فرزند <span class="val">${esc(c.peaceWitness.fatherName) || '............'}</span>
                        به نشانی <span class="val">${esc(c.peaceWitness.address) || '................................'}</span>
                        تنظیم گردیده و مورد تایید می‌باشد. مشخصات طرفین صلح به شرح این جدول می‌باشد:
                    </p>
                </div>

                <div class="box" style="font-size:0.89em; line-height:1.78;">
                    <p><strong>۱ -</strong> مورد مصالحه عبارت است از کلیه حقوق عینیه، حقیقیه، فرضیه، متصوره و احتمالیه ناشی از خرید یک دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..............'}</span> موضوع فرم درخواست ثبت نام شماره <span class="ltr val">${esc(toPersianDigits(c.registrationRequestNumber)) || '............'}</span> مورخ <span class="ltr val">${esc(toPersianDigits(c.registrationRequestDate)) || '............'}</span> به نحوی که پس از امضاء این صلحنامه هیچگونه حقی از حقوق مزبور برای مصالح باقی نمانده و همگی جزیی از مورد صلح است.</p>
                    <p><strong>۲ -</strong> کلیه شرایط صلح قطعی اعم از صیغه و غیره به اظهار طرفین اجرا شده و کافه خیارات ولو خیار غبن فاحش از طرفین ساقط گردید.</p>
                    <p><strong>۳ -</strong> مصالح (انتقال‌دهنده) ضمن اقرار به وصول تمام مال‌الصلح، اعلام می‌نماید هیچگونه ادعایی نسبت به وجوه واریز شده به حساب شرکت کرمان موتور بابت پیش پرداخت، اقساط باقیمانده، سود مشارکت، تأخیر، سایر منافع احتمالی و حقوق متصوره نداشته و هرگونه ادعایی را در حال و آینده از خود سلب و ساقط می‌نماید.</p>
                    <p><strong>۴ -</strong> مصالح ضمن عقد شرعی و قطعی فوق شرکت کرمان موتور را وکیل بلاعزل و وصی بلافصل خود قرار داده و می‌دهد تا نسبت به واگذاری خودرو به متصالح (انتقال‌گیرنده) طبق مقررات خود اقدام نماید.</p>
                    <p><strong>۵ -</strong> با امضای این صلحنامه، متصالح قائم‌مقام مصالح در قرارداد فوق‌الذکر بوده و علاوه بر قبول کلیه مفاد، شرایط و تعهدات آن قرارداد و سایر مکاتبات و مدارک شرکت کرمان موتور در قبال مورد مصالحه، ملزم به ایفای کلیه تعهدات مندرج در آن می‌باشد. متصالح اقرار می‌نماید نسخه قرارداد مذکور و نیز کلیه مدارک و مکاتبات شرکت کرمان موتور را از مصالح دریافت نموده است.</p>
                    <p><strong>۶ -</strong> طرفین اعلام می‌نمایند این صلحنامه صرفاً در نمایندگی محل ثبت نام اولیه و قبل از صدور فاکتور و سند خودرو تنظیم و تکمیل گردیده است.</p>
                    <p style="margin:0;"><strong>۷ -</strong> طرفین اعلام می‌نمایند هیچگونه وجهی بابت تنظیم این صلحنامه به نمایندگی شرکت پرداخت ننموده‌اند.</p>
                </div>

                ${peacePartyTableHtml(c.mosaleh, 'مشخصات طرف دوم (مصالح / انتقال‌دهنده)', {
                    name: 'شرکت واسپاری کرمان موتور',
                    reg: '۲۴۷۵۸۷',
                    addr: LEASING_COMPANY_INFO.peaceAddress
                })}

                <table class="data-table center">
                    <thead>
                        <tr>
                            <th>کد نمایندگی</th>
                            <th>شماره فرم درخواست ثبت نام خودرو</th>
                            <th>نوع محصول</th>
                            <th>تاریخ ثبت نام</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ltr val">${esc(toPersianDigits(c.dealershipCode))}</td>
                            <td class="ltr val">${esc(toPersianDigits(c.registrationRequestNumber)) || '-'}</td>
                            <td class="val-blue">${esc(c.carModel) || '-'}</td>
                            <td class="ltr val">${esc(toPersianDigits(c.registrationRequestDate)) || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="text-align:center; font-size:0.86em; font-weight:700; margin:4px 0;">
                    طرفین این صلحنامه با علم و آگاهی کامل از مفاد این صلحنامه نسبت به امضاء آن اقدام نمودند.
                </div>

                <div class="sig-grid c4" style="margin-top:6px;">
                    <div class="sig-cell">
                        <div><div class="sig-head">نام و نام خانوادگی مصالح</div><div class="sig-sub">${esc(mosName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">نام و نام خانوادگی متصالح</div><div class="sig-sub">${esc(motName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">شاهد اول</div><div class="sig-sub">${esc(c.peaceWitness.name) || '..........'}</div></div>
                        <div class="sig-foot">[ امضاء شاهد اول ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">مهر و امضای نمایندگی (شاهد دوم)</div><div class="sig-sub">کد: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderPeaceAddendum(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const motName = c.motasaleh.isLegal
        ? c.motasaleh.legalName
        : ([c.motasaleh.firstName, c.motasaleh.lastName].filter(Boolean).join(' ') || buyerName);
    const mosName = c.mosaleh.isLegal
        ? c.mosaleh.legalName
        : ([c.mosaleh.firstName, c.mosaleh.lastName].filter(Boolean).join(' ') || '....................');
    const refNo = c.peaceAddendumReferenceNo.trim() || c.registrationRequestNumber || '................';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'متمم صلحنامه',
                    subtitle: 'استثناء موضوع مطالبه خسارت تاخیر قراردادی',
                    docNumber: c.peaceNumber,
                    docDate: c.peaceAddendumDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box box-muted" style="margin-top:16px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                    <div><span class="l-meta-lbl">مورخه:</span> <span class="val ltr">${esc(toPersianDigits(c.peaceAddendumDate))}</span></div>
                    <div><span class="l-meta-lbl">موضوع صلح حواله شماره:</span> <span class="val-blue ltr">${esc(toPersianDigits(refNo))}</span></div>
                </div>

                <div class="box" style="padding:20px 18px; font-size:1.08em; line-height:2.45; margin-top:12px;">
                    <p style="margin:0;">
                        عطف به صلحنامه موصوف، نظر به صلح کلیه حقوق عینیه و متصوره از قرارداد شماره
                        <span class="ltr val-blue">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        انتقالی به آقا / خانم <span class="val-blue">${esc(motName)}</span> به عنوان متصالح، حسب این متمم کلیه حقوق متصوره از قرارداد شماره
                        <span class="ltr val-blue">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        از سوی مصالح به متصالح منتقل می‌گردد، به استثناء موضوع مطالبه خسارت تاخیر قراردادی که از موارد انتقال موضوع این صلحنامه خارج است و در این باره حقی برای متصالح متصور نمی‌باشد.
                    </p>
                </div>

                <div class="sig-grid c4" style="margin-top:36px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">امضاء مصالح</div><div class="sig-sub">${esc(mosName)}</div></div>
                        <div class="sig-foot">[ امضاء مصالح ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">شاهد ۱</div><div class="sig-sub">${esc(c.peaceWitness.name) || '..........'}</div></div>
                        <div class="sig-foot">[ امضاء شاهد ۱ ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">امضاء متصالح</div><div class="sig-sub">${esc(motName)}</div></div>
                        <div class="sig-foot">[ امضاء متصالح ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">شاهد ۲</div><div class="sig-sub">نمایندگی ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء شاهد ۲ ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 8. وکالت فک پلاک و تنظیم سند رهنی
// ============================================================================
function renderPoaPlateMortgage(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'وکالت فک پلاک و تنظیم سند رهنی',
                    subtitle: 'شرکت واسپاری کرمان موتور (سهامی خاص)',
                    docNumber: c.contractNumber,
                    docDate: c.contractDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box box-muted" style="font-size:0.95em;">
                    <p style="margin-bottom:4px;"><strong>نوع سند:</strong> وکالت فک پلاک و تنظیم سند رهنی</p>
                    <p style="margin-bottom:4px;"><strong>موکل:</strong> <span class="val-blue">${esc(c.buyer.title)} ${esc(buyerName)}</span> (کد ملی: <span class="ltr val">${esc(toPersianDigits(c.buyer.nationalCode)) || '..............'}</span>)</p>
                    <p style="margin-bottom:4px;"><strong>وکیل:</strong> شرکت واسپاری کرمان موتور سهامی خاص ثبت شده به شماره ۲۴۷۵۸۷ در اداره ثبت شرکت‌ها</p>
                    <p style="margin:0;"><strong>مقیم:</strong> تهران، سعادت آباد، بین میدان کاج و میدان قیصر امین‌پور، انتهای خیابان صرافهای شمالی، خیابان نوزدهم شمالی، پلاک ۲۱، طبقه ۵</p>
                </div>

                <div class="sec-title">مورد وکالت</div>
                <div class="box" style="font-size:0.94em; line-height:1.95;">
                    <p style="margin:0;">
                        بدواً اخذ مدارک و مستندات اعم از اصل یا رونوشت و المثنی بویژه سند کمپانی، شناسنامه مالکیت، بیمه‌نامه شخص ثالث، برگه گارانتی و سایر مدارک و مستندات قرارداد شماره
                        <span class="ltr val-blue">${esc(toPersianDigits(c.contractNumber)) || '..................'}</span>
                        مورخ <span class="ltr val">${esc(toPersianDigits(c.contractDate)) || '..............'}</span>
                        مربوط به خودروی <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره موتور <span class="ltr val">${esc(c.engineNumber) || '........................'}</span>
                        شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        شرکت کرمان موتور و سپس مراجعه به کلیه مراجع و ادارات دولتی و غیردولتی و نهادها و سازمان‌ها و بانک‌ها علی‌الخصوص شهرداری و دارایی و نیروی انتظامی و به ویژه ادارات و دوایر راهنمایی و رانندگی در سراسر کشور (اعم از اجرائیات، شماره‌گذاری و واحد نقل و انتقال خودرویی ناجا) و همچنین تحویل و ترخیص خودرو از مراجع انتظامی و قضایی و دریافت هرگونه مجوز و گواهی مفاصاحساب و مطالبه و اخذ هرگونه سند و مدرکی جهت تعویض یا فک پلاک منصوبه و دریافت پلاک جدید برای خودروی قرارداد فوق به نام هر شخص حقیقی یا حقوقی ولو به نام وکیل با دارا بودن اختیار انجام کلیه تشریفات لازم اعم از تعویض و فک پلاک و مطالبه و دریافت پلاک جدید و تودیع پلاک قبلی نزد مراجع ذیصلاح و اخذ رسید پلاک تودیعی و دریافت صورت وضعیت خلافی و اعتراض به آن نزد راهنمایی رانندگی یا مراجع قضایی و اعمال تخفیفات لازمه، النهایه تأدیه هزینه‌های مترتبه ولو با استفاده از مبالغ پرداختی موکل بابت اقساط و غیره، نیز تأدیه سایر هزینه‌های قانونی و عنداللزوم استرداد و دریافت اضافه پرداختی‌ها و سپردن هرگونه تعهد و قبول هرگونه شرط در جریان تعویض یا فک پلاک و اخذ پلاک جدید و تهیه و تسلیم یا اخذ هرگونه تعهد مدرک و مستندات اعم از اصل یا رونوشت از جمله شناسنامه مالکیت و کارت مشخصات خودرو مورد قرارداد و تقاضای ابطال کارت سوخت و یا صدور کارت جدید و اخذ آن و همچنین توثیق و ترهین خودرو موضوع قرارداد فوق‌الذکر به هر مبلغ و مدت و هر شرایط به نام و یا به نفع خود وکیل و هر شخص حقیقی یا حقوقی بنا به تشخیص وکیل و فک رهن از آن و دیگر تشریفات قانونی آن و پرداخت هرگونه هزینه مترتب بر انجام مورد وکالت با حق انجام کلیه مکاتبات با سلب نمودن هرگونه حق ادعا و اعتراض بعدی و احتمالی ولو به عنوان تضرر و غیره با حق تنظیم هرگونه وکالت‌نامه با هر موضوعی بنام هر شخص حقیقی یا حقوقی حتی بنام خود وکیل حین انجام مورد وکالت مکلف به ارائه مدارک صدرالذکر به مراجع مربوطه می‌باشد.
                    </p>
                </div>

                <div class="sec-title">حدود اختیارات و مشخصات ثبتی وکیل</div>
                <div class="box box-muted" style="font-size:0.93em;">
                    <p>
                        وکیل مرقوم در خصوص انجام مورد وکالت با حق توکیل به غیر دارای اختیارات تامه مزبوره می‌باشد. امضاء و اقدام و عمل وکیل در انجام مورد وکالت به منزله امضاء و اقدام و عمل و اظهار موکل نافذ و معتبر و دارای اثر و اعتبار قانونی می‌باشد به نحویکه در هیچ یک از موارد فوق نیازی به حضور و اجازه مجدد موکل نباشد. این وکالت فقط در نفس وکالت مؤثر است. موکل ضمن عقد خارج لازم حق عزل وکیل و ضم امین و انجام هر عملی منافی با انجام مورد وکالت توسط وکیل را از خود سلب و ساقط نمود.
                    </p>
                    <p style="margin:0; font-weight:800; color:#1e3a8a;">
                        شرکت واسپاری کرمان موتور (سهامی خاص) — شماره ثبت: ${LEASING_COMPANY_INFO.registrationNumber} | شناسه ملی: ${LEASING_COMPANY_INFO.nationalId} | کد اقتصادی: ${LEASING_COMPANY_INFO.economicCode} | تاریخ ثبت: ${LEASING_COMPANY_INFO.registrationDate} | محل ثبت: ${LEASING_COMPANY_INFO.registrationCity} | کد پستی: ${LEASING_COMPANY_INFO.postalCode} | تاریخ صدور: ${LEASING_COMPANY_INFO.licenseIssueDate}
                    </p>
                </div>

                <div class="sig-grid c2">
                    <div class="sig-cell" style="min-height:80px;">
                        <div><div class="sig-head">امضاء و اثر انگشت موکل (خریدار)</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت موکل ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:80px;">
                        <div><div class="sig-head">نمایندگی ${esc(toPersianDigits(c.dealershipCode))}</div><div class="sig-sub">${esc(c.dealershipName)}</div></div>
                        <div class="sig-foot">[ مهر و امضاء تایید ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 9. آخرین اطلاعات مشتری حقیقی & 11. آخرین اطلاعات ضامن یا صادرکننده چک
// ============================================================================
function renderDetailedPersonInfoForm(opts: {
    title: string;
    subtitle: string;
    person: LeasingPersonInfo;
    signatureTitle: string;
    includeVehicleAndDelivery: boolean;
    leasingCase: LeasingCase;
}): string {
    const { person: p, leasingCase: c } = opts;
    const fullName = getPersonFullName(p) || '-';
    const isSingle = p.maritalStatus === 'مجرد';
    const isMarried = p.maritalStatus === 'متاهل';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: opts.title,
                    subtitle: opts.subtitle,
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="sec-title">مشخصات هویتی و شناسنامه‌ای</div>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <th style="width:16%;">نام</th>
                            <td style="width:18%;" class="val-blue">${esc(p.firstName) || '-'}</td>
                            <th style="width:16%;">نام خانوادگی</th>
                            <td style="width:18%;" class="val-blue">${esc(p.lastName) || '-'}</td>
                            <th style="width:14%;">نام پدر</th>
                            <td style="width:18%;" class="val">${esc(p.fatherName) || '-'}</td>
                        </tr>
                        <tr>
                            <th>شماره شناسنامه</th>
                            <td class="ltr val">${esc(toPersianDigits(p.idNumber)) || '-'}</td>
                            <th>کد ملی</th>
                            <td class="ltr val-blue">${esc(toPersianDigits(p.nationalCode)) || '-'}</td>
                            <th>وضعیت تاهل</th>
                            <td>
                                <span class="check-inline"><span class="chk-sq">${isSingle ? '✓' : ''}</span> مجرد</span>
                                <span class="check-inline"><span class="chk-sq">${isMarried ? '✓' : ''}</span> متاهل</span>
                            </td>
                        </tr>
                        <tr>
                            <th>مدرک تحصیلی</th>
                            <td class="val">${esc(p.education) || '-'}</td>
                            <th>شغل</th>
                            <td class="val">${esc(p.occupation) || '-'}</td>
                            <th>تاریخ تولد</th>
                            <td class="ltr val">${esc(toPersianDigits(p.birthDate)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>استان محل تولد</th>
                            <td>${esc(p.birthProvince) || '-'}</td>
                            <th>شهرستان محل تولد</th>
                            <td>${esc(p.birthCounty) || '-'}</td>
                            <th>تاریخ صدور شناسنامه</th>
                            <td class="ltr val">${esc(toPersianDigits(p.idIssueDate)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>استان محل صدور</th>
                            <td>${esc(p.issueProvince) || '-'}</td>
                            <th>شهرستان محل صدور</th>
                            <td colspan="3">${esc(p.issueCounty || p.issuePlace) || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="sec-title">نشانی دقیق محل سکونت مطابق با احراز ارائه شده</div>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <th style="width:16%;">استان محل سکونت</th>
                            <td style="width:17%;">${esc(p.address.province) || '-'}</td>
                            <th style="width:16%;">شهرستان محل سکونت</th>
                            <td style="width:17%;">${esc(p.address.county) || '-'}</td>
                            <th style="width:16%;">شهر محل سکونت</th>
                            <td style="width:18%;">${esc(p.address.city) || '-'}</td>
                        </tr>
                        <tr>
                            <th>خیابان اصلی</th>
                            <td>${esc(p.address.mainStreet) || '-'}</td>
                            <th>خیابان فرعی</th>
                            <td>${esc(p.address.subStreet) || '-'}</td>
                            <th>کوچه</th>
                            <td>${esc(p.address.alley) || '-'}</td>
                        </tr>
                        <tr>
                            <th>شماره پلاک</th>
                            <td class="ltr">${esc(toPersianDigits(p.address.plaque)) || '-'}</td>
                            <th>طبقه</th>
                            <td class="ltr">${esc(toPersianDigits(p.address.floor)) || '-'}</td>
                            <th>واحد</th>
                            <td class="ltr">${esc(toPersianDigits(p.address.unit)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>منطقه شهرداری</th>
                            <td class="ltr">${esc(toPersianDigits(p.address.municipalityZone)) || '-'}</td>
                            <th>کد پستی ۱۰ رقمی</th>
                            <td colspan="3" class="ltr val-blue">${esc(toPersianDigits(p.address.postalCode)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>شماره تلفن ثابت</th>
                            <td colspan="2" class="ltr val">${esc(toPersianDigits(p.address.landlinePhone)) || '-'}</td>
                            <th>شماره تلفن همراه</th>
                            <td colspan="2" class="ltr val-blue">${esc(toPersianDigits(p.address.mobilePhone)) || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                ${opts.includeVehicleAndDelivery ? `
                    <div class="box box-amber" style="font-size:0.9em; margin:6px 0;">
                        <strong>قابل توجه مشتریانی که پلاک آزاد دارند:</strong>
                        در صورت تغییر نشانی نسبت به پلاک قبلی خود حتماً مراتب را به اطلاع مراکز نقل و انتقالات پلاک برسانید.
                    </div>
                    <div class="sec-title">مشخصات خودرو و محل تحویل</div>
                    <table class="data-table">
                        <tbody>
                            <tr>
                                <th style="width:16%;">نوع خودرو</th>
                                <td style="width:18%;" class="val-blue">${esc(c.carModel) || '-'}</td>
                                <th style="width:16%;">رنگ خودرو</th>
                                <td style="width:17%;" class="val">${esc(c.color) || '-'}</td>
                                <th style="width:16%;">تاریخ تکمیل فرم</th>
                                <td style="width:17%;" class="ltr val">${esc(toPersianDigits(c.formDate)) || '-'}</td>
                            </tr>
                            <tr>
                                <th>استان محل تحویل</th>
                                <td>${esc(c.deliveryProvince) || '-'}</td>
                                <th>شهرستان محل تحویل</th>
                                <td>${esc(c.deliveryCounty) || '-'}</td>
                                <th>شهر محل تحویل</th>
                                <td>${esc(c.deliveryCity) || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                ` : ''}

                <div class="sig-grid c2" style="margin-top:16px;">
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">${esc(opts.signatureTitle)}</div><div class="sig-sub">${esc(fullName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">مهر و امضاء نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 10. آخرین اطلاعات مشتری حقوقی در زمان تکمیل وجه / خرید قطعی جهت صدور سند و پلاک خودرو
// ============================================================================
function renderLegalCustomerFinalInfo(c: LeasingCase): string {
    const lb = c.legalBuyer;
    const ex = c.legalCustomerExtra;
    const isPriv = ex.companyType === 'خصوصی';
    const isGov = ex.companyType === 'دولتی';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: 'آخرین اطلاعات مشتری حقوقی جهت صدور سند و پلاک',
                    subtitle: 'در زمان تکمیل وجه / خرید قطعی',
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="sec-title">مشخصات موسسه / شرکت</div>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <th>عنوان موسسه / شرکت</th>
                            <td colspan="3" class="val-blue">${esc(lb.companyName) || '-'}</td>
                            <th>نوع شرکت</th>
                            <td>
                                <span class="check-inline"><span class="chk-sq">${isPriv ? '✓' : ''}</span> خصوصی</span>
                                <span class="check-inline"><span class="chk-sq">${isGov ? '✓' : ''}</span> دولتی</span>
                            </td>
                        </tr>
                        <tr>
                            <th>شناسه ملی</th>
                            <td class="ltr val-blue">${esc(toPersianDigits(lb.nationalId)) || '-'}</td>
                            <th>شماره ثبت</th>
                            <td class="ltr val">${esc(toPersianDigits(lb.registrationNumber)) || '-'}</td>
                            <th>کد اقتصادی</th>
                            <td class="ltr">${esc(toPersianDigits(lb.economicCode)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>نام مدیرعامل</th>
                            <td class="val">${esc(ex.ceoName || lb.rep1Name) || '-'}</td>
                            <th>نام کارگزار</th>
                            <td>${esc(ex.brokerName) || '-'}</td>
                            <th>تاریخ ثبت / شروع فعالیت</th>
                            <td class="ltr">${esc(toPersianDigits(ex.registrationDate || '-'))} | ${esc(toPersianDigits(ex.activityStartDate || '-'))}</td>
                        </tr>
                        <tr>
                            <th>محل ایجاد (استان/شهرستان/شهر)</th>
                            <td colspan="2">${esc([ex.establishmentProvince, ex.establishmentCounty, ex.establishmentCity].filter(Boolean).join(' - ')) || '-'}</td>
                            <th>محل دفتر (استان/شهرستان/شهر)</th>
                            <td colspan="2">${esc([ex.officeProvince, ex.officeCounty, ex.officeCity].filter(Boolean).join(' - ')) || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="sec-title">نشانی دقیق موسسه / شرکت مطابق با احراز سکونت</div>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <th>استان / شهر</th>
                            <td>${esc([ex.officeProvince, ex.officeCity].filter(Boolean).join(' - ')) || '-'}</td>
                            <th>منطقه شهرداری</th>
                            <td class="ltr">${esc(toPersianDigits(ex.municipalityZone)) || '-'}</td>
                            <th>کد پستی ۱۰ رقمی</th>
                            <td class="ltr val-blue">${esc(toPersianDigits(lb.postalCode)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>خیابان اصلی / فرعی</th>
                            <td colspan="2">${esc([ex.mainStreet, ex.subStreet].filter(Boolean).join(' - ')) || '-'}</td>
                            <th>کوچه اصلی / فرعی</th>
                            <td colspan="2">${esc([ex.mainAlley, ex.subAlley].filter(Boolean).join(' - ')) || '-'}</td>
                        </tr>
                        <tr>
                            <th>بلوک / پلاک</th>
                            <td class="ltr">${esc(ex.block || '-')} / ${esc(toPersianDigits(ex.plaque || '-'))}</td>
                            <th>طبقه / واحد</th>
                            <td class="ltr">${esc(toPersianDigits(ex.floor || '-'))} / ${esc(toPersianDigits(ex.unit || '-'))}</td>
                            <th>تلفن (پیش‌شماره) / نمابر</th>
                            <td class="ltr">${esc(toPersianDigits(ex.areaCode))}-${esc(toPersianDigits(lb.phone || '-'))} | ${esc(toPersianDigits(ex.fax || '-'))}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="sec-title">اطلاعات نماینده حقیقی معرفی شده از طرف موسسه / شرکت و خودرو</div>
                <table class="data-table">
                    <tbody>
                        <tr>
                            <th>نام و نام خانوادگی نماینده</th>
                            <td class="val-blue">${esc(ex.repFullName || lb.rep1Name) || '-'}</td>
                            <th>شماره شناسنامه</th>
                            <td class="ltr">${esc(toPersianDigits(ex.repIdNumber)) || '-'}</td>
                            <th>کد ملی نماینده</th>
                            <td class="ltr val">${esc(toPersianDigits(ex.repNationalCode)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>تلفن ثابت نماینده</th>
                            <td class="ltr">${esc(toPersianDigits(ex.repLandline)) || '-'}</td>
                            <th>تلفن همراه نماینده</th>
                            <td class="ltr val">${esc(toPersianDigits(ex.repMobile)) || '-'}</td>
                            <th>کد پستی نماینده</th>
                            <td class="ltr">${esc(toPersianDigits(ex.repPostalCode)) || '-'}</td>
                        </tr>
                        <tr>
                            <th>آدرس نماینده</th>
                            <td colspan="5">${esc(ex.repAddress) || '-'}</td>
                        </tr>
                        <tr>
                            <th>نوع خودرو درخواستی</th>
                            <td class="val-blue">${esc(c.carModel) || '-'}</td>
                            <th>رنگ خودرو درخواستی</th>
                            <td class="val">${esc(c.color) || '-'}</td>
                            <th>تاریخ تکمیل فرم</th>
                            <td class="ltr val">${esc(toPersianDigits(c.formDate)) || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="sig-grid c2" style="margin-top:16px;">
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">امضاء مشتری و مهر شرکت</div><div class="sig-sub">${esc(lb.companyName) || '..........'}</div></div>
                        <div class="sig-foot">[ مهر و امضاء مجاز ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:85px;">
                        <div><div class="sig-head">امضاء نماینده و نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ امضاء نماینده / مهر نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 12. فرم تعهد تعویض پلاک & 13. الحاقیه تعهد به تعویض پلاک
// ============================================================================
function renderPlateChangeCommitment(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';
    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'به نام خدا',
                    title: 'فرم تعهد تعویض پلاک',
                    subtitle: 'مدیریت محترم شرکت واسپاری کرمان موتور',
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="padding:20px 18px; font-size:1.06em; line-height:2.4; margin-top:18px;">
                    <p style="margin:0;">
                        اینجانب <span class="val-blue">${esc(buyerName)}</span>
                        دارای کد ملی به شماره <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '....................'}</span>
                        خریدار یک دستگاه خودروی <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        متعهد می‌گردد پس از دریافت نامه تعویض پلاک خودروی فوق حداکثر طی مدت ۳۰ روز نسبت به تعویض پلاک خودرو به نام خود اقدام و تصویر برگه سبز جدید را جهت درج در پرونده نمایم. در غیر این صورت شرکت واسپاری کرمان موتور می‌تواند مطابق با ماده ۶ قرارداد فیمابین به صلاحدید خود اقدام لازم را به عمل آورده و کلیه مسئولیت و عواقب ناشی از آن تماماً بر عهده اینجانب می‌باشد.
                    </p>
                </div>

                <div class="sig-grid c2" style="margin-top:34px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">امضاء و اثر انگشت خریدار</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت خریدار ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">مهر و امضای نمایندگی / شرکت</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderPlateChangeAddendum(c: LeasingCase): string {
    const buyerOrCorp = c.legalBuyer.isActive && c.legalBuyer.companyName.trim()
        ? c.legalBuyer.companyName
        : (getPersonFullName(c.buyer) || '................................');
    const pchk = c.plateChangeCheck;

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'الحاقیه تعهد به تعویض پلاک',
                    subtitle: 'مرتبط با قرارداد فروش اقساطی خودرو',
                    docNumber: c.contractNumber,
                    docDate: c.contractDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="font-size:0.93em;">
                    <p><strong class="val-blue">ماده ۱: تعهد اصلی و ضمانت اجرای آن: </strong>آقا / خانم / شرکت <span class="val-blue">${esc(buyerOrCorp)}</span> متعهد است حداکثر ظرف مدت ۳۰ روز کاری از تاریخ تحویل خودرو و دریافت مدارک، نسبت به تعویض پلاک و انتقال پلاک خودرو به نام خود اقدام نماید و مستندات تعویض پلاک را به شرکت تحویل دهد. تمامی جرایم، خلافی‌ها و تمام خسارات وارده ناشی از عدم تعویض پلاک در این مدت، به عهده مشتری است.</p>
                </div>

                <div class="box" style="font-size:0.92em;">
                    <p><strong class="val-blue">ماده ۲: تعهدات: </strong>در صورت عدم انجام تعویض پلاک ظرف مهلت تعیین شده، شرکت اختیار دارد هر یک از بندهای زیر و یا تمامی آنها را اعمال نماید:</p>
                    <p style="padding-right:12px;">الف) قرارداد را یک طرفه فسخ نماید؛ | ب) نسبت به توقیف یا استرداد خودرو از طریق مراجع انتظامی یا قضایی اقدام کند؛</p>
                    <p style="padding-right:12px;">پ) کلیه مطالبات و اقساط باقیمانده را سررسید شده تلقی و هرگونه اقدام لازم در این خصوص را به عمل آورد؛ | ت) ارائه هرگونه خدمات شامل بیمه، گارانتی، پشتیبانی و... را تا انجام تعویض پلاک متوقف سازد.</p>
                    <p style="margin:0;"><strong>تبصره:</strong> تمامی هزینه‌های مربوطه اعم از توقیف، حمل و نقل، پارکینگ، دادرسی، و خسارات وارده و غیره به عهده مشتری بوده و شرکت می‌تواند آنها را از محل تضامین وصول کند.</p>
                </div>

                <div class="box" style="font-size:0.91em;">
                    <p><strong class="val-blue">ماده ۳: حسن انجام تعهد: </strong>جهت حسن انجام تعهد موضوع این تعهدنامه مبنی بر تعویض پلاک در مهلت مقرر، خریدار یک فقره چک به مبلغ <span class="val-green">${toPersianDigits(formatCurrencyWithCommas(pchk.amountRials || 1000000000))} ریال</span> در اختیار شرکت قرار می‌دهد. در صورتی که چک مذکور توسط شخصی غیر از خریدار صادر شده باشد یا شخص ثالثی به عنوان ضامن معرفی گردد، صادرکننده چک و ضامن متضامناً و مشترکاً با خریدار مسئول اجرای کلیه تعهدات مندرج در این تعهدنامه از جمله انجام تعویض پلاک در موعد مقرر خواهند بود و شرکت حق خواهد داشت در صورت عدم انجام تعهد در مهلت تعیین شده، نسبت به وصول وجه چک و مطالبه کلیه خسارات قانونی از هریک از متعهدین منفرداً یا مجتمعاً اقدام نماید. همچنین تمامی جرایم، خلافی‌ها، هزینه‌های ناشی از توقیف، حمل و نقل، پارکینگ و اجرای ضمانت اجراهای عدم انجام تعهد نیز به صلاحدید شرکت از این محل قابل وصول خواهد بود.</p>
                    <p><strong>الف)</strong> استرداد چک منوط به ارائه مدارک رسمی دال بر انجام کامل تعویض پلاک و تسویه کلیه جرائم و هزینه‌ها و خسارات احتمالی خواهد بود و وصول وجه چک مانع از مطالبه خسارات مازاد وارده نخواهد بود.</p>
                    <p><strong>ب)</strong> کلیه متعهدین با امضای این تعهدنامه اقرار می‌نمایند چک موضوع این ماده در اختیار شرکت قرار گرفته و نزد شرکت به عنوان حسن انجام تعهد نگهداری می‌شود و حق هرگونه ایراد و اعتراض نسبت به نحوه استفاده و وصول آن در صورت عدم انجام تعهد در موعد مقرر را از خود سلب و ساقط می‌نمایند.</p>

                    <table class="data-table center">
                        <thead>
                            <tr>
                                <th>مبلغ چک به ریال</th>
                                <th>تاریخ چک</th>
                                <th>شماره و سری چک</th>
                                <th>صادرکننده</th>
                                <th>کد ملی</th>
                                <th>بانک</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="ltr val-green">${toPersianDigits(formatCurrencyWithCommas(pchk.amountRials || 1000000000))}</td>
                                <td class="ltr">${esc(toPersianDigits(pchk.checkDate)) || '-'}</td>
                                <td class="ltr">${esc(toPersianDigits(pchk.checkNumber)) || '-'}</td>
                                <td>${esc(pchk.issuerName || getPersonFullName(c.buyer)) || '-'}</td>
                                <td class="ltr">${esc(toPersianDigits(pchk.issuerNationalCode || c.buyer.nationalCode)) || '-'}</td>
                                <td>${esc(pchk.bankName) || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="sig-grid c3">
                    <div class="sig-cell">
                        <div><div class="sig-head">امضاء و اثر انگشت خریدار</div><div class="sig-sub">${esc(buyerOrCorp)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">امضاء و اثر انگشت صادرکننده چک</div><div class="sig-sub">${esc(pchk.issuerName || getPersonFullName(c.buyer)) || '..........'}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">امضاء فروشنده</div><div class="sig-sub">شرکت واسپاری کرمان موتور</div></div>
                        <div class="sig-foot">[ مهر و امضاء ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// 14. فرم ۱۵ درخواست عودت چک تعهد به تعویض پلاک & 15. رسید دریافت نامه تعویض پلاک & 16. فرم فک رهن
// ============================================================================
function renderPlateCheckReturnRequest(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';
    const pr = c.plateReturnRequest;
    const pchk = c.plateChangeCheck;

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'درخواست عودت چک تعهد به تعویض پلاک (فرم ۱۵)',
                    subtitle: 'مدیریت محترم شرکت واسپاری کرمان موتور',
                    docNumber: pr.letterNumber || c.contractNumber,
                    docDate: pr.letterDate || c.formDate,
                    attachment: pr.attachment || 'برگه سبز',
                    dealershipCode: c.dealershipCode
                })}

                <div class="box">
                    <p>
                        با سلام احتراماً به استحضار می‌رساند اینجانب / شرکت <span class="val-blue">${esc(buyerName)}</span>
                        به کد ملی / شناسه ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '................'}</span>
                        خریدار یک دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..............'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        به استناد برگ سبز خودرو به پیوست کلیه تعهدات خود را نسبت به تعویض پلاک به عمل آورده‌ام. خواهشمند است دستورات مقتضی جهت عودت چک ضمانت تعویض پلاک به اینجانب مبذول گردد. لازم به ذکر است تحویل مدارک به فرد معرفی شده از سوی نمایندگی شماره <span class="val">${esc(toPersianDigits(c.dealershipCode))}</span> کرمان موتور از نظر اینجانب بلامانع می‌باشد.
                    </p>
                    <div class="sig-grid c2" style="margin-top:8px;">
                        <div class="sig-cell" style="min-height:66px;">
                            <div><div class="sig-head">نام و نام خانوادگی (خریدار)</div><div class="sig-sub">${esc(buyerName)}</div></div>
                            <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                        </div>
                        <div class="sig-cell" style="min-height:66px;">
                            <div><div class="sig-head">امضاء و مهر نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                            <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                        </div>
                    </div>
                </div>

                <div class="sec-title">گردش کار و تاییدیه‌های آزادسازی چک ضمانت (اداری و مالی)</div>
                <div class="box box-muted" style="line-height:2.05;">
                    <p>
                        <strong>۱. واحد پشتیبانی فروش:</strong> با عنایت به فرم الحاقیه تعهد تعویض پلاک و درخواست مشتری، آزادسازی یک فقره چک ضمانت به شماره <span class="ltr val-blue">${esc(toPersianDigits(pchk.checkNumber)) || '................'}</span> و تاریخ سررسید <span class="ltr val">${esc(toPersianDigits(pchk.checkDate)) || '............'}</span> جهت عودت به مشتری نامبرده صورت پذیرد.
                        <span style="float:left; font-weight:800; color:#475569;">امضاء واحد پشتیبانی فروش: ......................</span>
                    </p>
                    <p style="border-top:1px dashed #cbd5e1; padding-top:6px;">
                        <strong>۲. مدیریت محترم فروش:</strong> مدیر عامل محترم شرکت واسپاری کرمان موتور؛ بنابر بررسی‌های صورت گرفته، تعویض پلاک فوق مورد تایید است.
                        <span style="float:left; font-weight:800; color:#475569;">امضاء مدیریت فروش: ......................</span>
                    </p>
                    <p style="border-top:1px dashed #cbd5e1; padding-top:6px;">
                        <strong>۳. امور مالی:</strong> عودت چک فوق بلامانع است.
                        <span style="float:left; font-weight:800; color:#475569;">امضاء مدیر عامل: ......................</span>
                    </p>
                    <p style="border-top:1px dashed #cbd5e1; padding-top:6px; margin:0;">
                        <strong>۴. تحویل نهایی:</strong> چک فوق به مشتری نامبرده، عودت داده شد.
                        <span style="float:left; font-weight:800; color:#475569;">امضاء امور مالی: ......................</span>
                    </p>
                </div>
            </div>
        </section>
    `;
}

function renderPlateLetterReceipt(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';
    const refDate = c.plateReturnRequest.receiptReferralDate || c.formDate;

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'به نام خدا',
                    title: 'فرم رسید دریافت نامه تعویض پلاک',
                    subtitle: 'مدیریت محترم شرکت واسپاری کرمان موتور',
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="padding:22px 18px; font-size:1.08em; line-height:2.45; margin-top:20px;">
                    <p style="margin:0;">
                        اینجانب <span class="val-blue">${esc(buyerName)}</span>
                        به کد ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '....................'}</span>
                        خریدار یک دستگاه خودروی <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        در تاریخ <span class="ltr val">${esc(toPersianDigits(refDate)) || '............'}</span>
                        به نمایندگی / شرکت <span class="val">${esc(c.dealershipName)}</span>
                        مراجعه و اصل نامه تعویض پلاک خودروی فوق را دریافت نمودم.
                    </p>
                </div>

                <div class="sig-grid c2" style="margin-top:36px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">امضاء و اثر انگشت خریدار</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت خریدار ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">مهر و امضای نمایندگی / شرکت</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء رسمی نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderMortgageReleaseRequest(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '................................';
    const opt = c.mortgageReleaseOptions;
    const chk = (v: boolean) => `<span class="chk-sq">${v ? '✓' : ''}</span>`;

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'به نام خدا',
                    title: 'فرم درخواست فک رهن و استرداد اسناد',
                    subtitle: 'مدیریت محترم شرکت واسپاری کرمان موتور',
                    docNumber: c.contractNumber,
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box" style="padding:16px 16px; font-size:1.02em; line-height:2.2; margin-top:12px;">
                    <p>
                        با سلام احتراماً به استحضار می‌رساند اینجانب <span class="val-blue">${esc(buyerName)}</span>
                        به کد ملی <span class="ltr val-blue">${esc(toPersianDigits(c.buyer.nationalCode)) || '....................'}</span>
                        خریدار یک دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        به استناد تایید پیوست کلیه تعهدات خود نسبت به خرید خودرو فوق را به عمل آورده‌ام. خواهشمند است موارد درخواستی زیر مورد بررسی و اقدام مقتضی به عمل آید:
                    </p>

                    <div class="box box-muted" style="line-height:2.1; font-weight:700; margin:10px 0;">
                        <div>${chk(opt.guaranteeDocs)} الف - عودت اسناد ضمانت قرارداد</div>
                        <div>${chk(opt.earlySettlementChecks)} ب - استرداد چک‌های اقساط به واسطه تسویه زودتر از موعد</div>
                        <div>${chk(opt.mortgageReleaseLetter)} ج - ارائه نامه فک رهن خودرو</div>
                        <div>${chk(opt.bouncedCheck)} د - استرداد چک برگشتی</div>
                        <div>${chk(opt.bankDepositChecks)} ه - استرداد چک‌های تسهیلات اقساط بابت واریز بانکی</div>
                    </div>

                    <p style="margin:0;">
                        لازم به ذکر است تحویل مدارک به فرد معرفی شده از سوی نمایندگی شماره <span class="val">${esc(toPersianDigits(c.dealershipCode))}</span> کرمان موتور
                        به مدیریت <span class="val">${esc(c.dealershipManagerName) || '........................'}</span>
                        از نظر اینجانب / اینجانبان بلامانع می‌باشد.
                    </p>
                </div>

                <div class="sig-grid c3" style="margin-top:28px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام و نام خانوادگی (خریدار)</div><div class="sig-sub">${esc(buyerName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">نام و نام خانوادگی (ارائه‌دهنده اسناد)</div><div class="sig-sub">${esc(opt.presenterName) || '..........'}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div><div class="sig-head">امضاء و مهر نمایندگی</div><div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ============================================================================
// Dispatcher & Multi-Form Bundler
// ============================================================================
function renderSingleFormHtml(c: LeasingCase, formId: LeasingFormId): string {
    switch (formId) {
        case 'PRE_REGISTRATION':
            return renderPreRegistration(c);
        case 'INSTALLMENT_CONTRACT':
            return renderInstallmentContract(c);
        case 'ARTICLE_36_FORM':
            return renderArticle36Form(c);
        case 'NATURAL_AFFIDAVIT':
            return renderNaturalAffidavit(c);
        case 'LEGAL_AFFIDAVIT':
            return renderLegalAffidavit(c);
        case 'LEASING_PEACE_CONTRACT':
            return renderLeasingPeaceContract(c);
        case 'PEACE_ADDENDUM':
            return renderPeaceAddendum(c);
        case 'POA_PLATE_MORTGAGE':
            return renderPoaPlateMortgage(c);
        case 'CUSTOMER_FINAL_INFO':
            return renderDetailedPersonInfoForm({
                title: 'آخرین اطلاعات مشتری در زمان خرید / تکمیل وجه',
                subtitle: 'جهت صدور سند و پلاک خودرو',
                person: c.buyer,
                signatureTitle: 'امضاء و اثر انگشت مشتری',
                includeVehicleAndDelivery: true,
                leasingCase: c
            });
        case 'LEGAL_CUSTOMER_FINAL_INFO':
            return renderLegalCustomerFinalInfo(c);
        case 'GUARANTOR_FINAL_INFO': {
            const target = c.activeGuarantorTabForFinalForm === 'guarantor2'
                ? c.guarantor2
                : c.activeGuarantorTabForFinalForm === 'buyer'
                ? c.buyer
                : c.guarantor1;
            const roleNote = c.activeGuarantorTabForFinalForm === 'guarantor2'
                ? 'ضامن دوم'
                : c.activeGuarantorTabForFinalForm === 'buyer'
                ? 'صادرکننده چک (متقاضی)'
                : 'ضامن اول';
            return renderDetailedPersonInfoForm({
                title: 'آخرین اطلاعات ضامن یا صادرکننده چک',
                subtitle: `احراز هویت و نشانی (${roleNote})`,
                person: target,
                signatureTitle: 'امضاء و اثر انگشت ضامن / صادرکننده چک',
                includeVehicleAndDelivery: false,
                leasingCase: c
            });
        }
        case 'PLATE_CHANGE_COMMITMENT':
            return renderPlateChangeCommitment(c);
        case 'PLATE_CHANGE_ADDENDUM':
            return renderPlateChangeAddendum(c);
        case 'PLATE_CHECK_RETURN_REQUEST':
            return renderPlateCheckReturnRequest(c);
        case 'PLATE_LETTER_RECEIPT':
            return renderPlateLetterReceipt(c);
        case 'MORTGAGE_RELEASE_REQUEST':
            return renderMortgageReleaseRequest(c);
    }
}

function buildLeasingFooterHtml(
    docTitle: string,
    c: LeasingCase,
    design: DocumentPrintDesignSettings
): string {
    if (!design.showFooter) return '';

    const vars = {
        docTitle,
        docNumber: toPersianDigits(c.contractNumber || '-'),
        docDate: toPersianDigits(c.contractDate || c.formDate || '-')
    };
    const rightText = formatFooterTemplateText(design.footerRightText, vars).trim();
    const leftText = formatFooterTemplateText(design.footerLeftText, vars).trim();
    const pageBadge = design.showPageNumbers
        ? '<span class="sheet-page-num-badge">صفحه {{DOC_PAGE}} از {{DOC_PAGES}}</span>'
        : '';

    const leftCombined =
        leftText && pageBadge
            ? `${esc(leftText)} | ${pageBadge}`
            : leftText
            ? esc(leftText)
            : pageBadge;

    return `
        <footer class="l-footer">
            <span>${esc(rightText)}</span>
            <span>${leftCombined}</span>
        </footer>
    `;
}

function convertFormSheetsToSourceUnits(
    rawHtml: string,
    c: LeasingCase,
    design: DocumentPrintDesignSettings
): string {
    const units: string[] = [];
    const sectionRegex = /<section class="form-sheet(?:\s+page-break-after)?">([\s\S]*?)<\/section>/g;
    let match: RegExpExecArray | null;

    while ((match = sectionRegex.exec(rawHtml)) !== null) {
        let inner = match[1].trim();
        // Strip outer <div class="doc-content">...</div> wrapper if present
        if (inner.startsWith('<div class="doc-content">') && inner.endsWith('</div>')) {
            inner = inner.slice('<div class="doc-content">'.length, -'</div>'.length).trim();
        }

        // Extract <header class="l-header"...>...</header>
        let headerHtml = '';
        let rawTitle = 'فرم لیزینگ کرمان موتور';
        const hdrMatch = inner.match(/<header class="l-header"([^>]*)>[\s\S]*?<\/header>/);
        if (hdrMatch) {
            const fullHeaderTag = hdrMatch[0];
            const headerAttrs = hdrMatch[1] || '';
            inner = inner.replace(fullHeaderTag, '').trim();

            const titleMatch = fullHeaderTag.match(/<h1 class="l-title">([\s\S]*?)<\/h1>/);
            if (titleMatch) {
                rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim() || rawTitle;
            }

            const optsAttrMatch = headerAttrs.match(/data-hdr-opts="([^"]*)"/);
            if (optsAttrMatch) {
                try {
                    const parsedOpts = JSON.parse(decodeURIComponent(optsAttrMatch[1])) as LeasingHeaderOpts;
                    rawTitle = design.headerCustomTitle.trim() || parsedOpts.title || rawTitle;
                    headerHtml = renderCustomizedLeasingHeaderHtml(parsedOpts, design);
                } catch {
                    headerHtml = design.showHeader ? fullHeaderTag : '';
                }
            } else {
                headerHtml = design.showHeader ? fullHeaderTag : '';
            }
        }

        // Extract optional <div class="page-tag">...</div> into footer label instead of inline body
        let pageTagText = '';
        const tagMatch = inner.match(/<div class="page-tag">([\s\S]*?)<\/div>/);
        if (tagMatch) {
            pageTagText = tagMatch[1].replace(/<[^>]+>/g, '').trim();
            inner = inner.replace(tagMatch[0], '').trim();
        }

        const footerTitle = pageTagText ? `${rawTitle} (${pageTagText})` : rawTitle;
        const footerHtml = buildLeasingFooterHtml(footerTitle, c, design);

        units.push(`
            <article class="doc-source-unit">
                <div class="src-hdr">${headerHtml}</div>
                <div class="src-ftr">${footerHtml}</div>
                <div class="src-body">${inner}</div>
            </article>
        `);
    }

    return units.join('\n');
}

export function buildLeasingHtmlDocument(
    leasingCase: LeasingCase,
    formsToRender: LeasingFormId[],
    options: LeasingHtmlPrintOptions = {}
): string {
    const paperSize: DocumentPaperSize = options.paperSize || 'A4';
    const design = options.design || getDefaultPrintDesign('leasing', paperSize);
    const showWatermark = options.showWatermark ?? design.showWatermark;
    const list = formsToRender.length > 0 ? formsToRender : (['PRE_REGISTRATION'] as LeasingFormId[]);

    const buyerName = getPersonFullName(leasingCase.buyer) || 'مشتری';
    const docTitle = list.length === 1
        ? `فرم لیزینگ - ${buyerName} (${leasingCase.contractNumber})`
        : `پکیج فرم‌های لیزینگ (${toPersianDigits(list.length)} فرم) - ${buyerName}`;

    const rawSectionsHtml = list
        .map((fid) => renderSingleFormHtml(leasingCase, fid))
        .join('\n');

    const sourceUnitsHtml = convertFormSheetsToSourceUnits(rawSectionsHtml, leasingCase, design);

    const wmMainText = design.watermarkText?.trim() || '';
    const wmSubText = design.watermarkSubText?.trim() || '';
    const watermarkInnerHtml = (wmMainText || wmSubText)
        ? `
        <div class="watermark-text">
            ${wmMainText ? `<div class="wm-en">${esc(wmMainText)}</div>` : ''}
            ${wmSubText ? `<div class="wm-sub">${esc(wmSubText)}</div>` : ''}
        </div>
        `
        : '';

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(docTitle)}</title>
    ${collectVazirmatnFontCss(options.forStandaloneDownload)}
    ${buildLeasingCss(paperSize, showWatermark, design)}
</head>
<body>
    <div id="doc-sources-vault" aria-hidden="true">
        ${sourceUnitsHtml}
    </div>

    <main id="paginated-pages-root" dir="rtl" lang="fa"></main>

    ${buildAutoPaginationScript(watermarkInnerHtml, paperSize, 'leasing')}
</body>
</html>`;
}
