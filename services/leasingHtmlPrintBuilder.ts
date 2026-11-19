/**
 * Dedicated RTL HTML + CSS Print & Preview Builder for Leasing Forms (شرکت واسپاری کرمان موتور)
 * Covers all 8 forms with 100% RTL Persian layout, Vazirmatn typography, A4/A5 support,
 * and single-form or multi-form batch printing.
 */

import type { DocumentPaperSize } from '../types/bankLetter';
import type {
    LeasingCase,
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

export interface LeasingHtmlPrintOptions {
    paperSize?: DocumentPaperSize;
    showWatermark?: boolean;
    forStandaloneDownload?: boolean;
    forms?: LeasingFormId[];
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

function buildLeasingCss(paperSize: DocumentPaperSize, showWatermark: boolean): string {
    const isA5 = paperSize === 'A5';
    const pageW = isA5 ? '148mm' : '210mm';
    const pageMinH = isA5 ? '210mm' : '297mm';
    const screenPad = isA5 ? '8mm 9mm 11mm 9mm' : '11mm 13mm 14mm 13mm';
    const printMargin = isA5 ? '7mm 8mm 10mm 8mm' : '9mm 11mm 12mm 11mm';
    const baseFont = isA5 ? '9.2pt' : '10.4pt';
    const lineHeight = isA5 ? '1.78' : '1.92';

    return `
    <style>
        @page {
            size: ${paperSize} portrait;
            margin: ${printMargin};
            @bottom-left {
                content: "صفحه " counter(page) " از " counter(pages);
                font-family: 'Vazirmatn', Tahoma, sans-serif;
                font-size: ${isA5 ? '7pt' : '8pt'};
                color: #64748b;
            }
            @bottom-right {
                content: "نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو شیراز) — تلفن: ${COMPANY_PHONE_PERSIAN}";
                font-family: 'Vazirmatn', Tahoma, sans-serif;
                font-size: ${isA5 ? '7pt' : '8pt'};
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

        .form-sheet {
            width: ${pageW};
            max-width: 100%;
            min-height: ${pageMinH};
            margin: 0 auto 20px;
            background-color: #ffffff;
            padding: ${screenPad};
            border-radius: 6px;
            box-shadow: 0 10px 28px -8px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(148, 163, 184, 0.45);
            position: relative;
        }

        .page-break-after {
            page-break-after: always;
            break-after: page;
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
            opacity: 0.03;
        }

        .watermark-text {
            transform: rotate(-18deg);
            text-align: center;
            font-weight: 900;
            color: #0f172a;
        }
        .watermark-text .wm-en { font-size: ${isA5 ? '26pt' : '38pt'}; letter-spacing: 3px; }
        .watermark-text .wm-sub { font-size: ${isA5 ? '12pt' : '16pt'}; margin-top: 4px; color: #334155; }

        .doc-content { position: relative; z-index: 1; }

        /* Top Header */
        .l-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 7px;
            margin-bottom: 10px;
            break-inside: avoid;
        }
        .l-logo-box {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1 1 32%;
        }
        .l-badge {
            width: ${isA5 ? '32px' : '40px'};
            height: ${isA5 ? '32px' : '40px'};
            border-radius: 8px;
            background: linear-gradient(135deg, #b91c1c, #1e293b);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: ${isA5 ? '9pt' : '11pt'};
            flex-shrink: 0;
        }
        .l-title-box {
            flex: 1 1 40%;
            text-align: center;
        }
        .l-basmala {
            font-size: ${isA5 ? '8pt' : '9.5pt'};
            font-weight: 800;
            color: #334155;
        }
        .l-title {
            margin: 0;
            font-size: ${isA5 ? '11pt' : '13.5pt'};
            font-weight: 900;
            color: #0f172a;
        }
        .l-subtitle {
            font-size: ${isA5 ? '7pt' : '8pt'};
            color: #475569;
            font-weight: 700;
        }
        .l-meta-box {
            flex: 1 1 28%;
            text-align: left;
            font-size: ${isA5 ? '7.6pt' : '8.6pt'};
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
            font-size: ${isA5 ? '8.8pt' : '9.8pt'};
            color: #0f172a;
            margin: 7px 0 5px;
            border-radius: 4px;
        }

        .box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: ${isA5 ? '6px 8px' : '8px 11px'};
            margin-bottom: 7px;
            background: #ffffff;
            break-inside: avoid;
        }
        .box-muted {
            background: #f8fafc;
        }
        .box-amber {
            background: #fffbeb;
            border-color: #fcd34d;
        }

        p {
            margin: 0 0 5px;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }

        .val { font-weight: 800; color: #0f172a; }
        .val-blue { font-weight: 800; color: #1e3a8a; }
        .val-green { font-weight: 900; color: #065f46; }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0 8px;
            font-size: ${isA5 ? '7.6pt' : '8.7pt'};
        }
        table.data-table th, table.data-table td {
            border: 1px solid #94a3b8;
            padding: ${isA5 ? '3px 5px' : '4px 7px'};
            text-align: right;
            vertical-align: middle;
        }
        table.data-table th {
            background: #f1f5f9;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
        }
        table.data-table.center th, table.data-table.center td {
            text-align: center;
        }
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
        }

        /* Signature grids */
        .sig-grid {
            display: grid;
            gap: 8px;
            margin-top: 12px;
            padding-top: 8px;
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
            padding: 6px 6px;
            text-align: center;
            min-height: ${isA5 ? '62px' : '74px'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: ${isA5 ? '7.5pt' : '8.4pt'};
        }
        .sig-head { font-weight: 900; color: #0f172a; }
        .sig-sub { font-size: 0.9em; color: #475569; }
        .sig-foot { font-size: 0.85em; color: #94a3b8; margin-top: 16px; }

        .page-tag {
            text-align: left;
            font-size: 7.5pt;
            font-weight: 800;
            color: #64748b;
            margin-top: 6px;
        }

        .avoid-break { break-inside: avoid; page-break-inside: avoid; }

        @media print {
            html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
            }
            .form-sheet {
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                display: block !important;
                overflow: visible !important;
            }
            .watermark-layer { position: fixed !important; opacity: 0.025 !important; }
        }
    </style>
    `;
}

function headerBlock(opts: {
    basmala?: string;
    title: string;
    subtitle?: string;
    docNumber?: string;
    docDate?: string;
    dealershipCode?: string;
}): string {
    return `
        <header class="l-header">
            <div class="l-logo-box">
                <div class="l-badge">KMC</div>
                <div>
                    <div style="font-weight:900; font-size:0.95em; color:#0f172a;">شرکت واسپاری کرمان موتور</div>
                    <div style="font-size:0.8em; color:#475569; font-weight:700;">نمایندگی ${esc(toPersianDigits(opts.dealershipCode || '2606'))} حسینی خودرو شیراز</div>
                </div>
            </div>
            <div class="l-title-box">
                ${opts.basmala ? `<div class="l-basmala">${esc(opts.basmala)}</div>` : ''}
                <h1 class="l-title">${esc(opts.title)}</h1>
                ${opts.subtitle ? `<div class="l-subtitle">${esc(opts.subtitle)}</div>` : ''}
            </div>
            <div class="l-meta-box">
                ${opts.docNumber ? `<div class="l-meta-row"><span class="l-meta-lbl">شماره:</span><span class="l-meta-val ltr">${esc(toPersianDigits(opts.docNumber))}</span></div>` : ''}
                ${opts.docDate ? `<div class="l-meta-row"><span class="l-meta-lbl">تاریخ:</span><span class="l-meta-val ltr">${esc(toPersianDigits(opts.docDate))}</span></div>` : ''}
            </div>
        </header>
    `;
}

function personSummaryParagraph(label: string, p: LeasingPersonInfo): string {
    const fullName = getPersonFullName(p) || '....................';
    const addr = buildFullAddressLine(p.address) || '........................................';
    return `
        <p style="margin-bottom:4px;">
            <span class="val-blue">${esc(label)}: </span>
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

function renderInstallmentContract(c: LeasingCase): string {
    const buyerName = getPersonFullName(c.buyer) || '....................';
    const g1Name = getPersonFullName(c.guarantor1);
    const g2Name = getPersonFullName(c.guarantor2);
    const lb = c.legalBuyer;
    const remaining = c.remainingAmountRials > 0
        ? c.remainingAmountRials
        : Math.max(0, (c.installmentTotalPriceRials || c.cashPriceRials) - c.prepaymentRials);

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
                <span class="val-blue">ب - ۲ (اشخاص حقوقی): </span>
                شرکت ........................ به شماره ثبت ................ و شناسه ملی ........................ ثبت شده در اداره ثبت شرکت‌های ............ با شماره اقتصادی ........................ و به نمایندگی آقایان/خانم‌ها .................... بعنوان ............ و .................... بعنوان ............ صاحبین امضاء مجاز طبق روزنامه رسمی شماره ............ مورخ ............ به نشانی: ........................................ کد پستی ................ تلفن ................ که از این پس در این قرارداد به اختصار خریدار نامیده می‌شود.
            </p>
        `;

    const fourSigs = `
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

    const checksRowsHtml = (c.checks && c.checks.length > 0 ? c.checks : [
        { id: '1', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
        { id: '2', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
        { id: '3', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' },
        { id: '4', amountRials: 0, checkDate: '', checkNumber: '', issuerName: '', issuerNationalCode: '', bankName: '' }
    ]).map((chk, idx) => `
        <tr>
            <td>${toPersianDigits(idx + 1)}</td>
            <td class="ltr val">${chk.amountRials > 0 ? esc(toPersianDigits(formatCurrencyWithCommas(chk.amountRials))) : ''}</td>
            <td class="ltr">${chk.checkDate ? esc(toPersianDigits(chk.checkDate)) : ''}</td>
            <td class="ltr">${chk.checkNumber ? esc(toPersianDigits(chk.checkNumber)) : ''}</td>
            <td>${esc(chk.issuerName)}</td>
            <td class="ltr">${chk.issuerNationalCode ? esc(toPersianDigits(chk.issuerNationalCode)) : ''}</td>
            <td>${esc(chk.bankName)}</td>
        </tr>
    `).join('');

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

                <div class="box">
                    <div class="val-blue" style="margin-bottom:3px;">ج - ضامن:</div>
                    ${personSummaryParagraph('ج - ۱', c.guarantor1)}
                    ${personSummaryParagraph('ج - ۲', c.guarantor2)}
                    <div style="font-size:0.9em; color:#475569;">که از این پس در این قرارداد به اختصار ضامن خریدار نامیده می‌شود.</div>
                </div>

                ${fourSigs}
                <div class="page-tag">صفحه ۱</div>
            </div>
        </section>
    `;

    const page2 = `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: 'ادامه قرارداد فروش اقساطی خودرو',
                    subtitle: 'شرایط مورد معامله، مبلغ قرارداد و جدول چک‌های اقساط',
                    docNumber: c.contractNumber,
                    docDate: c.contractDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="sec-title">ماده ۲ - موضوع قرارداد (مورد معامله)</div>
                <div class="box">
                    <p>
                        موضوع قرارداد عبارتست از فروش اقساطی تمامی یک دستگاه خودرو <span class="val-blue">${esc(c.carModel) || '..................'}</span>
                        مدل <span class="val">${esc(toPersianDigits(c.modelYear)) || '......'}</span>
                        به شماره شاسی <span class="ltr val">${esc(c.chassisNumber) || '........................'}</span>
                        و شماره موتور <span class="ltr val">${esc(c.engineNumber) || '........................'}</span>
                        طبق فاکتور/مبایعه‌نامه <span class="val">${esc(c.invoiceOrBillRef) || '....................'}</span>
                        که تماماً و عیناً به رویت خریدار رسیده و از کمیت و کیفیت و سلامت آن کلاً و کاملاً مطلع می‌باشد صیغه عقد بیع جاری و خریدار اقرار به تحویل مورد معامله بطور صحیح و سالم و با کیفیتی که مورد تقاضای وی بوده است نمود.
                    </p>
                    <p style="margin:0; font-size:0.94em;">
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
                        طبق مصوبه شورای پول و اعتبار <span class="val">${esc(toPersianDigits(c.annualProfitPercent))}</span> درصد در سال می‌باشد.
                    </div>
                </div>

                <div class="sec-title">ماده ۵ - مبلغ قرارداد و جدول اقساط</div>
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
                        طی <span class="val">${esc(toPersianDigits(c.installmentsCount))}</span> قسط با تناوب <span class="val">${esc(toPersianDigits(c.installmentIntervalMonths))}</span> ماهه
                        از سوی متقاضی و ضامن با سررسیدهای به شرح ذیل به فروشنده تعهد پرداخت نمایند:
                    </p>

                    <table class="data-table center">
                        <thead>
                            <tr>
                                <th style="width:7%;">ردیف</th>
                                <th style="width:18%;">مبلغ چک به ریال</th>
                                <th style="width:13%;">تاریخ چک</th>
                                <th style="width:14%;">شماره چک</th>
                                <th style="width:20%;">صادرکننده</th>
                                <th style="width:14%;">کد ملی</th>
                                <th style="width:14%;">بانک</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${checksRowsHtml}
                        </tbody>
                    </table>

                    <p style="margin:0; font-size:0.93em;">
                        <strong>تبصره ۲)</strong> این قرارداد در صورتی اجرایی خواهد شد که خریدار کل مبلغ پیش پرداخت را به حساب معرفی شده از سوی فروشنده واریز نموده باشد.
                    </p>
                </div>

                ${fourSigs}
                <div class="page-tag">صفحه ۲</div>
            </div>
        </section>
    `;

    return page1 + page2;
}

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
                        <div>
                            <div class="sig-head">نام و نام خانوادگی متقاضی</div>
                            <div class="sig-sub">${esc(buyerName)}</div>
                        </div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">نام و نام خانوادگی واریزکننده</div>
                            <div class="sig-sub">${esc(payerName)}</div>
                        </div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">مهر و امضاء نمایندگی</div>
                            <div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div>
                        </div>
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
                        <div>
                            <div class="sig-head">نام و نام خانوادگی متقاضی</div>
                            <div class="sig-sub">${esc(buyerName)}</div>
                        </div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">نام شرکت واریزکننده</div>
                            <div class="sig-sub">${esc(coName)}</div>
                        </div>
                        <div class="sig-foot">[ امضاء صاحبان مجاز و مهر شرکت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div>
                            <div class="sig-head">مهر و امضاء نمایندگی</div>
                            <div class="sig-sub">کد نمایندگی: ${esc(toPersianDigits(c.dealershipCode))}</div>
                        </div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderPeacePartyTable(roleLabel: string, p: LeasingPeaceParty, includeCompanyDefault = false): string {
    const legalName = p.isLegal ? p.legalName : (includeCompanyDefault ? 'شرکت واسپاری کرمان موتور' : '');
    const legalReg = p.isLegal ? p.legalRegNumber : (includeCompanyDefault ? LEASING_COMPANY_INFO.registrationNumber : '');
    const legalAddr = p.isLegal ? p.legalAddress : (includeCompanyDefault ? LEASING_COMPANY_INFO.peaceAddress : '');

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th colspan="5" style="background:#e2e8f0; text-align:right;">مشخصات ${esc(roleLabel)}</th>
                </tr>
                <tr>
                    <th>نام خانوادگی</th>
                    <th>نام</th>
                    <th>نام پدر</th>
                    <th>شماره شناسنامه</th>
                    <th>صادره</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="val">${esc(p.lastName)}</td>
                    <td class="val">${esc(p.firstName)}</td>
                    <td>${esc(p.fatherName)}</td>
                    <td class="ltr">${esc(toPersianDigits(p.idNumber))}</td>
                    <td>${esc(p.issuePlace)}</td>
                </tr>
                <tr>
                    <th>تاریخ تولد</th>
                    <th>تاریخ صدور</th>
                    <th>کد ملی</th>
                    <th>کد پستی</th>
                    <th>تلفن همراه</th>
                </tr>
                <tr>
                    <td class="ltr">${esc(toPersianDigits(p.birthDate))}</td>
                    <td class="ltr">${esc(toPersianDigits(p.idIssueDate))}</td>
                    <td class="ltr val-blue">${esc(toPersianDigits(p.nationalCode))}</td>
                    <td class="ltr">${esc(toPersianDigits(p.postalCode))}</td>
                    <td class="ltr">${esc(toPersianDigits(p.mobilePhone))}</td>
                </tr>
                <tr>
                    <th>شخصیت حقوقی</th>
                    <td colspan="2">${esc(legalName)}</td>
                    <th>شماره ثبت</th>
                    <td class="ltr">${esc(toPersianDigits(legalReg))}</td>
                </tr>
                <tr>
                    <th>نشانی</th>
                    <td colspan="4">${esc(legalAddr)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function renderLeasingPeaceContract(c: LeasingCase): string {
    const mosalehFallback: LeasingPeaceParty = (c.mosaleh.firstName || c.mosaleh.lastName || c.mosaleh.legalName)
        ? c.mosaleh
        : {
            ...c.mosaleh,
            isLegal: false
        };
    const motasalehFallback: LeasingPeaceParty = (c.motasaleh.firstName || c.motasaleh.lastName || c.motasaleh.legalName)
        ? c.motasaleh
        : {
            isLegal: false,
            firstName: c.buyer.firstName,
            lastName: c.buyer.lastName,
            fatherName: c.buyer.fatherName,
            idNumber: c.buyer.idNumber,
            issuePlace: c.buyer.issuePlace,
            birthDate: c.buyer.birthDate,
            idIssueDate: c.buyer.idIssueDate,
            nationalCode: c.buyer.nationalCode,
            postalCode: c.buyer.address.postalCode,
            mobilePhone: c.buyer.address.mobilePhone,
            legalName: '',
            legalRegNumber: '',
            legalAddress: ''
        };

    const mosFullName = mosalehFallback.isLegal
        ? mosalehFallback.legalName
        : `${mosalehFallback.firstName} ${mosalehFallback.lastName}`.trim() || '....................';
    const motFullName = motasalehFallback.isLegal
        ? motasalehFallback.legalName
        : `${motasalehFallback.firstName} ${motasalehFallback.lastName}`.trim() || '....................';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: 'صلحنامه',
                    subtitle: 'شرکت واسپاری کرمان موتور (سهامی خاص)',
                    docNumber: c.peaceNumber,
                    docDate: c.peaceDate,
                    dealershipCode: c.dealershipCode
                })}

                ${renderPeacePartyTable('متصالح (انتقال گیرنده)', motasalehFallback, false)}

                <p style="font-size:0.92em; margin:4px 0 6px;">
                    این صلحنامه در محل نمایندگی و با حضور انتقال‌دهنده و انتقال‌گیرنده، شهود شامل نمایندگی مجاز
                    <span class="val">${esc(toPersianDigits(c.dealershipCode))}</span>
                    و آقای/خانم <span class="val">${esc(c.peaceWitness.name) || '....................'}</span>
                    فرزند <span class="val">${esc(c.peaceWitness.fatherName) || '..........'}</span>
                    به نشانی <span class="val">${esc(c.peaceWitness.address) || '........................................'}</span>
                    تنظیم گردیده و مورد تایید می‌باشد. مشخصات طرفین صلح به شرح جدول زیر و فوق می‌باشد:
                </p>

                <div class="box" style="font-size:0.9em; line-height:1.72;">
                    <p><strong>۱ -</strong> مورد مصالحه عبارت است از کلیه حقوق عینیه، حقیقیه، فرضیه، متصوره و احتمالیه ناشی از خرید یک دستگاه خودرو موضوع فرم درخواست ثبت نام شماره <span class="ltr val">${esc(toPersianDigits(c.registrationRequestNumber)) || '............'}</span> مورخ <span class="ltr val">${esc(toPersianDigits(c.registrationRequestDate)) || '............'}</span> به نحوی که پس از امضاء این صلحنامه هیچگونه حقی از حقوق مزبور برای مصالح باقی نمانده و همگی جزئی از مورد صلح است.</p>
                    <p><strong>۲ -</strong> کلیه شرایط صلح قطعی اعم از صیغه و غیره به اظهار طرفین اجرا شده و کافه خیارات ولو خیار غبن فاحش از طرفین ساقط گردید.</p>
                    <p><strong>۳ -</strong> مصالح (انتقال‌دهنده) ضمن اقرار به وصول تمام مال‌الصلح، اعلام می‌نماید هیچگونه ادعایی نسبت به وجوه واریز شده به حساب شرکت کرمان موتور بابت پیش پرداخت، اقساط باقیمانده، سود مشارکت، تأخیر، سایر منافع احتمالی و حقوق متصوره نداشته و هرگونه ادعایی را در حال و آینده از خود سلب و ساقط می‌نماید.</p>
                    <p><strong>۴ -</strong> مصالح ضمن عقد شرعی و قطعی فوق شرکت کرمان موتور را وکیل بلاعزل و وصی بلافصل خود قرارداده و می‌دهد تا نسبت به واگذاری خودرو به متصالح (انتقال‌گیرنده) طبق مقررات خود اقدام نماید.</p>
                    <p><strong>۵ -</strong> با امضای این صلح‌نامه، متصالح قائم‌مقام مصالح در قرارداد فوق‌الذکر بوده و علاوه بر قبول کلیه مفاد، شرایط و تعهدات آن قرارداد و سایر مکاتبات و مدارک شرکت کرمان موتور در قبال مورد مصالحه، ملزم به ایفای کلیه تعهدات مندرج در آن می‌باشد. متصالح اقرار می‌نماید نسخه قرارداد مذکور و نیز کلیه مدارک و مکاتبات شرکت کرمان موتور را از مصالح دریافت نموده است.</p>
                    <p><strong>۶ -</strong> طرفین اعلام می‌نمایند این صلحنامه صرفاً در نمایندگی محل ثبت نام اولیه و قبل از صدور فاکتور و سند خودرو تنظیم و تکمیل گردیده است.</p>
                    <p style="margin:0;"><strong>۷ -</strong> طرفین اعلام می‌نمایند هیچگونه وجهی بابت تنظیم این صلحنامه به نمایندگی شرکت پرداخت ننموده‌اند.</p>
                </div>

                ${renderPeacePartyTable('مصالح (انتقال دهنده)', mosalehFallback, true)}

                <table class="data-table center">
                    <tr>
                        <th>کد نمایندگی</th>
                        <td class="ltr val">${esc(toPersianDigits(c.dealershipCode))}</td>
                        <th>شماره فرم درخواست ثبت نام خودرو</th>
                        <td class="ltr val">${esc(toPersianDigits(c.registrationRequestNumber))}</td>
                        <th>نوع محصول</th>
                        <td class="val">${esc(c.carModel)}</td>
                        <th>تاریخ ثبت نام</th>
                        <td class="ltr val">${esc(toPersianDigits(c.registrationRequestDate))}</td>
                    </tr>
                </table>

                <p style="text-align:center; font-weight:800; font-size:0.92em; margin-top:4px;">
                    طرفین این صلحنامه با علم و آگاهی کامل از مفاد این صلحنامه نسبت به امضاء آن اقدام نمودند.
                </p>

                <div class="sig-grid c4">
                    <div class="sig-cell">
                        <div><div class="sig-head">نام و نام خانوادگی مصالح</div><div class="sig-sub">${esc(mosFullName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">نام و نام خانوادگی متصالح</div><div class="sig-sub">${esc(motFullName)}</div></div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">شاهد اول</div><div class="sig-sub">${esc(c.peaceWitness.name) || '..........'}</div></div>
                        <div class="sig-foot">[ امضاء شاهد اول ]</div>
                    </div>
                    <div class="sig-cell">
                        <div><div class="sig-head">مهر و امضای نمایندگی</div><div class="sig-sub">(شاهد دوم)</div></div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderPeaceAddendum(c: LeasingCase): string {
    const motFullName = c.motasaleh.isLegal
        ? c.motasaleh.legalName
        : (`${c.motasaleh.firstName} ${c.motasaleh.lastName}`.trim() || getPersonFullName(c.buyer) || '....................');
    const refNo = c.peaceAddendumReferenceNo || c.registrationRequestNumber || '............';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    basmala: 'بسمه تعالی',
                    title: 'متمم صلحنامه',
                    subtitle: `مورخه ${toPersianDigits(c.peaceAddendumDate || c.peaceDate)}`,
                    docNumber: c.peaceNumber,
                    docDate: c.peaceAddendumDate || c.peaceDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="box box-muted" style="margin-top:14px;">
                    <div style="font-weight:800;">
                        متمم صلحنامه مورخه: <span class="ltr val">${esc(toPersianDigits(c.peaceAddendumDate || c.peaceDate))}</span>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        موضوع صلح حواله شماره: <span class="ltr val-blue">${esc(toPersianDigits(refNo))}</span>
                    </div>
                </div>

                <div class="box" style="padding:20px 18px; font-size:1.08em; line-height:2.45; margin-top:12px;">
                    <p style="margin:0;">
                        عطف به صلحنامه موصوف، نظر به صلح کلیه حقوق عینیه و متصوره از قرارداد شماره
                        <span class="ltr val-blue">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        انتقالی به آقا / خانم <span class="val-blue">${esc(motFullName)}</span>
                        به عنوان متصالح، حسب این متمم کلیه حقوق متصوره از قرارداد شماره
                        <span class="ltr val-blue">${esc(toPersianDigits(c.contractNumber)) || '................'}</span>
                        از سوی مصالح به متصالح منتقل می‌گردد، به استثناء موضوع مطالبه خسارت تاخیر قراردادی که از موارد انتقال موضوع این صلحنامه خارج است و در این باره حقی برای متصالح متصور نمی‌باشد.
                    </p>
                </div>

                <div class="sig-grid c4" style="margin-top:34px;">
                    <div class="sig-cell" style="min-height:95px;">
                        <div class="sig-head">امضاء مصالح</div>
                        <div class="sig-foot">[ امضاء مصالح ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div class="sig-head">شاهد ۱</div>
                        <div class="sig-foot">[ امضاء شاهد ۱ ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div class="sig-head">امضاء متصالح</div>
                        <div class="sig-foot">[ امضاء متصالح ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:95px;">
                        <div class="sig-head">شاهد ۲</div>
                        <div class="sig-foot">[ امضاء شاهد ۲ ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderDetailedPersonInfoForm(opts: {
    title: string;
    subtitle: string;
    person: LeasingPersonInfo;
    signatureTitle: string;
    includeVehicleAndDelivery?: boolean;
    leasingCase: LeasingCase;
}): string {
    const p = opts.person;
    const c = opts.leasingCase;
    const a = p.address;

    const vehicleSection = opts.includeVehicleAndDelivery
        ? `
            <div class="box box-amber" style="font-size:0.88em; margin-top:6px;">
                <strong>قابل توجه مشتریانی که پلاک آزاد دارند:</strong>
                در صورت تغییر نشانی نسبت به پلاک قبلی خود حتماً مراتب را به اطلاع مراکز نقل و انتقالات پلاک برسانید.
            </div>
            <table class="data-table">
                <tr>
                    <th>نوع خودرو</th>
                    <td class="val-blue">${esc(c.carModel)}</td>
                    <th>رنگ خودرو</th>
                    <td class="val">${esc(c.color)}</td>
                    <th>تاریخ تکمیل فرم</th>
                    <td class="ltr val">${esc(toPersianDigits(c.formDate))}</td>
                </tr>
                <tr>
                    <th>استان محل تحویل خودرو</th>
                    <td>${esc(c.deliveryProvince)}</td>
                    <th>شهرستان محل تحویل خودرو</th>
                    <td>${esc(c.deliveryCounty)}</td>
                    <th>شهر محل تحویل خودرو</th>
                    <td>${esc(c.deliveryCity)}</td>
                </tr>
            </table>
        `
        : '';

    return `
        <section class="form-sheet">
            <div class="doc-content">
                ${headerBlock({
                    title: opts.title,
                    subtitle: opts.subtitle,
                    docDate: c.formDate,
                    dealershipCode: c.dealershipCode
                })}

                <div class="sec-title">مشخصات فردی و شناسنامه‌ای</div>
                <table class="data-table">
                    <tr>
                        <th style="width:16%;">نام</th>
                        <td style="width:17%;" class="val-blue">${esc(p.firstName)}</td>
                        <th style="width:16%;">نام خانوادگی</th>
                        <td style="width:18%;" class="val-blue">${esc(p.lastName)}</td>
                        <th style="width:15%;">نام پدر</th>
                        <td style="width:18%;" class="val">${esc(p.fatherName)}</td>
                    </tr>
                    <tr>
                        <th>شماره شناسنامه</th>
                        <td class="ltr val">${esc(toPersianDigits(p.idNumber))}</td>
                        <th>کد ملی</th>
                        <td class="ltr val-blue">${esc(toPersianDigits(p.nationalCode))}</td>
                        <th>وضعیت تاهل</th>
                        <td>
                            <span class="check-inline"><span class="chk-sq">${p.maritalStatus === 'مجرد' ? '✓' : ''}</span> مجرد</span>
                            <span class="check-inline"><span class="chk-sq">${p.maritalStatus === 'متاهل' ? '✓' : ''}</span> متاهل</span>
                        </td>
                    </tr>
                    <tr>
                        <th>مدرک تحصیلی</th>
                        <td>${esc(p.education)}</td>
                        <th>شغل</th>
                        <td colspan="3">${esc(p.occupation)}</td>
                    </tr>
                    <tr>
                        <th>استان محل تولد</th>
                        <td>${esc(p.birthProvince)}</td>
                        <th>شهرستان محل تولد</th>
                        <td>${esc(p.birthCounty)}</td>
                        <th>تاریخ تولد</th>
                        <td class="ltr">${esc(toPersianDigits(p.birthDate))}</td>
                    </tr>
                    <tr>
                        <th>استان محل صدور</th>
                        <td>${esc(p.issueProvince)}</td>
                        <th>شهرستان محل صدور</th>
                        <td>${esc(p.issueCounty || p.issuePlace)}</td>
                        <th>تاریخ صدور شناسنامه</th>
                        <td class="ltr">${esc(toPersianDigits(p.idIssueDate))}</td>
                    </tr>
                </table>

                <div class="sec-title">نشانی دقیق محل سکونت مطابق با احراز ارائه شده</div>
                <table class="data-table">
                    <tr>
                        <th style="width:16%;">استان محل سکونت</th>
                        <td style="width:17%;">${esc(a.province)}</td>
                        <th style="width:16%;">شهرستان محل سکونت</th>
                        <td style="width:18%;">${esc(a.county)}</td>
                        <th style="width:15%;">شهر محل سکونت</th>
                        <td style="width:18%;">${esc(a.city)}</td>
                    </tr>
                    <tr>
                        <th>خیابان اصلی</th>
                        <td>${esc(a.mainStreet)}</td>
                        <th>خیابان فرعی</th>
                        <td>${esc(a.subStreet)}</td>
                        <th>کوچه</th>
                        <td>${esc(a.alley)}</td>
                    </tr>
                    <tr>
                        <th>شماره پلاک</th>
                        <td class="ltr">${esc(toPersianDigits(a.plaque))}</td>
                        <th>طبقه</th>
                        <td class="ltr">${esc(toPersianDigits(a.floor))}</td>
                        <th>واحد</th>
                        <td class="ltr">${esc(toPersianDigits(a.unit))}</td>
                    </tr>
                    <tr>
                        <th>منطقه شهرداری</th>
                        <td class="ltr">${esc(toPersianDigits(a.municipalityZone))}</td>
                        <th>کد پستی ۱۰ رقمی</th>
                        <td colspan="3" class="ltr val-blue">${esc(toPersianDigits(a.postalCode))}</td>
                    </tr>
                    <tr>
                        <th>شماره تلفن ثابت</th>
                        <td colspan="2" class="ltr">${esc(toPersianDigits(a.landlinePhone))}</td>
                        <th>شماره تلفن همراه</th>
                        <td colspan="2" class="ltr val-blue">${esc(toPersianDigits(a.mobilePhone))}</td>
                    </tr>
                </table>

                ${vehicleSection}

                <div class="sig-grid c2" style="margin-top:16px;">
                    <div class="sig-cell" style="min-height:85px;">
                        <div>
                            <div class="sig-head">${esc(opts.signatureTitle)}</div>
                            <div class="sig-sub">${esc(getPersonFullName(p) || '....................')}</div>
                        </div>
                        <div class="sig-foot">[ امضاء و اثر انگشت ]</div>
                    </div>
                    <div class="sig-cell" style="min-height:85px;">
                        <div>
                            <div class="sig-head">مهر و امضاء نمایندگی</div>
                            <div class="sig-sub">نمایندگی ${esc(toPersianDigits(c.dealershipCode))} کرمان موتور</div>
                        </div>
                        <div class="sig-foot">[ مهر و امضاء نمایندگی ]</div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderSingleFormHtml(c: LeasingCase, formId: LeasingFormId): string {
    switch (formId) {
        case 'PRE_REGISTRATION':
            return renderPreRegistration(c);
        case 'INSTALLMENT_CONTRACT':
            return renderInstallmentContract(c);
        case 'NATURAL_AFFIDAVIT':
            return renderNaturalAffidavit(c);
        case 'LEGAL_AFFIDAVIT':
            return renderLegalAffidavit(c);
        case 'LEASING_PEACE_CONTRACT':
            return renderLeasingPeaceContract(c);
        case 'PEACE_ADDENDUM':
            return renderPeaceAddendum(c);
        case 'CUSTOMER_FINAL_INFO':
            return renderDetailedPersonInfoForm({
                title: 'آخرین اطلاعات مشتری در زمان خرید / تکمیل وجه جهت صدور سند و پلاک خودرو',
                subtitle: 'احراز نشانی و مشخصات متقاضی جهت شماره‌گذاری',
                person: c.buyer,
                signatureTitle: 'امضاء و اثر انگشت مشتری',
                includeVehicleAndDelivery: true,
                leasingCase: c
            });
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
    }
}

export function buildLeasingHtmlDocument(
    leasingCase: LeasingCase,
    formsToRender: LeasingFormId[],
    options: LeasingHtmlPrintOptions = {}
): string {
    const paperSize: DocumentPaperSize = options.paperSize || 'A4';
    const showWatermark = options.showWatermark ?? true;
    const list = formsToRender.length > 0 ? formsToRender : ['PRE_REGISTRATION' as LeasingFormId];

    const buyerName = getPersonFullName(leasingCase.buyer) || 'مشتری';
    const docTitle = list.length === 1
        ? `فرم لیزینگ - ${buyerName} (${leasingCase.contractNumber})`
        : `پکیج فرم‌های لیزینگ (${toPersianDigits(list.length)} فرم) - ${buyerName}`;

    const sectionsHtml = list
        .map((fid, idx) => {
            const html = renderSingleFormHtml(leasingCase, fid);
            if (idx < list.length - 1 && !html.includes('page-break-after')) {
                return html.replace('<section class="form-sheet">', '<section class="form-sheet page-break-after">');
            }
            return html;
        })
        .join('\n');

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(docTitle)}</title>
    ${collectVazirmatnFontCss(options.forStandaloneDownload)}
    ${buildLeasingCss(paperSize, showWatermark)}
</head>
<body>
    <div class="watermark-layer" aria-hidden="true">
        <div class="watermark-text">
            <div class="wm-en">KERMAN MOTOR LEASING</div>
            <div class="wm-sub">HOSEINI KHODRO 2606</div>
        </div>
    </div>

    <main dir="rtl" lang="fa">
        ${sectionsHtml}
    </main>
</body>
</html>`;
}
