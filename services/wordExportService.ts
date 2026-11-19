/**
 * Word (.docx) Export Service for Official Dealership Documents
 * Generates compliant Right-to-Left (RTL) Microsoft Word documents supporting both A4 and A5 paper sizes:
 *  - Official 3-Column Letterhead Table
 *  - Explicit DXA column widths scaled cleanly to A4 (210x297mm) or A5 (148x210mm)
 *  - Running header on Page 2+ and Persian Page Numbering ("صفحه X از Y") in footer
 *  - Official company contact: 07191690906
 */

import {
    Document,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    Header,
    Footer,
    Packer,
    AlignmentType,
    WidthType,
    BorderStyle,
    PageNumber
} from 'docx';
import type {
    CarPeaceContract,
    BankLetter,
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

const FONT_PERSIAN = 'Tahoma';
const COMPANY_PHONE_PERSIAN = '۰۷۱۹۱۶۹۰۹۰۶';
const COMPANY_PHONE_RAW = '07191690906';

interface PageLayoutConfig {
    paperSize: DocumentPaperSize;
    widthTwips: number;
    heightTwips: number;
    margin: { top: number; bottom: number; right: number; left: number };
    printableWidth: number;
    scaleSize: (baseHalfPoints: number) => number;
    scaleCols: (baseCols: number[]) => number[];
}

function getPageLayoutConfig(paperSize: DocumentPaperSize = 'A4'): PageLayoutConfig {
    if (paperSize === 'A5') {
        // A5 portrait: 148mm x 210mm => 8391 x 11906 twips
        // 15mm margins => 850 twips each side => printable width = 6691 twips
        const printableWidth = 6691;
        const ratio = printableWidth / 9070;
        return {
            paperSize: 'A5',
            widthTwips: 8391,
            heightTwips: 11906,
            margin: { top: 850, bottom: 850, right: 850, left: 850 },
            printableWidth,
            scaleSize: (base) => Math.max(13, Math.round(base * 0.85)),
            scaleCols: (cols) => {
                const scaled = cols.map((c) => Math.round(c * ratio));
                const diff = printableWidth - scaled.reduce((a, b) => a + b, 0);
                if (scaled.length > 0) scaled[0] += diff;
                return scaled;
            }
        };
    }

    // A4 portrait: 210mm x 297mm => 11906 x 16838 twips
    const printableWidth = 9070;
    return {
        paperSize: 'A4',
        widthTwips: 11906,
        heightTwips: 16838,
        margin: { top: 1417, bottom: 1417, right: 1417, left: 1417 },
        printableWidth,
        scaleSize: (base) => base,
        scaleCols: (cols) => cols
    };
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildDefaultDocStyles(fontSize: number) {
    return {
        default: {
            document: {
                run: {
                    font: FONT_PERSIAN,
                    size: fontSize,
                    color: '1E293B',
                    rightToLeft: true,
                    language: { value: 'fa-IR', bidirectional: 'fa-IR' }
                },
                paragraph: {
                    bidirectional: true,
                    alignment: AlignmentType.RIGHT
                }
            }
        }
    };
}

function createTextRun(text: string, options: {
    bold?: boolean;
    size?: number;
    color?: string;
    italics?: boolean;
} = {}): TextRun {
    return new TextRun({
        text,
        font: FONT_PERSIAN,
        rightToLeft: true,
        language: { value: 'fa-IR', bidirectional: 'fa-IR' },
        bold: options.bold ?? false,
        size: options.size ?? 22,
        color: options.color ?? '1E293B',
        italics: options.italics ?? false
    });
}

function createParagraph(children: TextRun[], options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingAfter?: number;
    spacingBefore?: number;
    lineSpacing?: number;
} = {}): Paragraph {
    return new Paragraph({
        bidirectional: true,
        alignment: options.alignment ?? AlignmentType.RIGHT,
        spacing: {
            before: options.spacingBefore ?? 40,
            after: options.spacingAfter ?? 60,
            line: options.lineSpacing ?? 360
        },
        children
    });
}

function buildRunningHeader(docTitle: string, docNumber: string, cfg: PageLayoutConfig): Paragraph {
    return new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 80 },
        children: [
            createTextRun(`شرکت تضامنی حسینی خودرو شیراز (نمایندگی ۲۶۰۶ کرمان موتور) — ${docTitle} شماره: `, {
                size: cfg.scaleSize(15),
                color: '94A3B8'
            }),
            createTextRun(toPersianDigits(docNumber || '-'), {
                size: cfg.scaleSize(15),
                color: '64748B',
                bold: true
            })
        ]
    });
}

function buildOfficialFooterTable(addressText: string, phoneText: string, cfg: PageLayoutConfig): Table {
    const [rightColWidth, leftColWidth] = cfg.scaleCols([6800, 2270]);
    const textSize = cfg.scaleSize(16);

    return new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [rightColWidth, leftColWidth],
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: rightColWidth, type: WidthType.DXA },
                        margins: { top: 60, bottom: 60, left: 60, right: 60 },
                        children: [
                            createParagraph([
                                createTextRun(`${addressText} | ${phoneText}`, { size: textSize, color: '64748B' })
                            ], { alignment: AlignmentType.RIGHT, spacingBefore: 40, spacingAfter: 40 })
                        ]
                    }),
                    new TableCell({
                        width: { size: leftColWidth, type: WidthType.DXA },
                        margins: { top: 60, bottom: 60, left: 60, right: 60 },
                        children: [
                            createParagraph([
                                createTextRun('صفحه ', { size: textSize, color: '64748B' }),
                                new TextRun({ children: [PageNumber.CURRENT], font: FONT_PERSIAN, size: textSize, rightToLeft: true }),
                                createTextRun(' از ', { size: textSize, color: '64748B' }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_PERSIAN, size: textSize, rightToLeft: true })
                            ], { alignment: AlignmentType.LEFT, spacingBefore: 40, spacingAfter: 40 })
                        ]
                    })
                ]
            })
        ]
    });
}

function buildGenericHeaderTable(
    title: string,
    subtitle: string,
    docNumber: string,
    docDate: string,
    cfg: PageLayoutConfig
): Table {
    const [col1, col2, col3] = cfg.scaleCols([3200, 3470, 2400]);

    return new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [col1, col2, col3],
        margins: { top: 80, bottom: 100, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '1E3A8A' },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: col1, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('شرکت تضامنی حسینی خودرو شیراز', { bold: true, size: cfg.scaleSize(20), color: '0F172A' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun('نمایندگی رسمی کرمان موتور - کد ۲۶۰۶', { bold: true, size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 })
                        ]
                    }),
                    new TableCell({
                        width: { size: col2, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('بسمه تعالی', { bold: true, size: cfg.scaleSize(22), color: '0F172A' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([createTextRun(title, { bold: true, size: cfg.scaleSize(25), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            ...(subtitle ? [createParagraph([createTextRun(subtitle, { size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 })] : [])
                        ]
                    }),
                    new TableCell({
                        width: { size: col3, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([
                                createTextRun('شماره: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(toPersianDigits(docNumber || '-'), { bold: true, size: cfg.scaleSize(18), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('تاریخ: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(toPersianDigits(docDate || '-'), { bold: true, size: cfg.scaleSize(18), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 })
                        ]
                    })
                ]
            })
        ]
    });
}

// =========================================================================
// 1. CAR PEACE CONTRACT (قرارداد صلح خودرو)
// =========================================================================

export async function exportPeaceContractToWord(
    contract: CarPeaceContract,
    paperSize: DocumentPaperSize = 'A4'
): Promise<void> {
    const cfg = getPageLayoutConfig(paperSize);
    const contractNo = contract.contractNumber || '1405/PC-1001';
    const contractDate = contract.contractDate || '1405/06/22';
    const companyPhone = (!contract.releasorPhone || contract.releasorPhone === '09370518538')
        ? COMPANY_PHONE_RAW
        : contract.releasorPhone;
    const totalAmountStr = contract.totalAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(contract.totalAmountRials))} ریال (${numberToPersianWords(contract.totalAmountRials)} ریال)`
        : '........................ ریال';
    const paidAmountStr = contract.paidAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(contract.paidAmountRials))} ریال`
        : (contract.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(contract.totalAmountRials))} ریال` : '........................ ریال');

    const [hCol1, hCol2, hCol3] = cfg.scaleCols([3300, 3170, 2600]);
    const headerTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [hCol1, hCol2, hCol3],
        margins: { top: 80, bottom: 100, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '1E3A8A' },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: hCol1, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('شرکت تضامنی حسینی خودرو شیراز', { bold: true, size: cfg.scaleSize(21), color: '0F172A' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun('نمایندگی رسمی کرمان موتور - کد ۲۶۰۶', { bold: true, size: cfg.scaleSize(18), color: '475569' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun(`تلفن: ${COMPANY_PHONE_PERSIAN}`, { size: cfg.scaleSize(16), color: '64748B' })], { alignment: AlignmentType.RIGHT, spacingAfter: 30 })
                        ]
                    }),
                    new TableCell({
                        width: { size: hCol2, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('بسمه تعالی', { bold: true, size: cfg.scaleSize(22), color: '0F172A' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([createTextRun('قرارداد صلح خودرو', { bold: true, size: cfg.scaleSize(27), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([createTextRun('(مشمول ماده ۱۰ قانون مدنی)', { size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.CENTER, spacingAfter: 30 })
                        ]
                    }),
                    new TableCell({
                        width: { size: hCol3, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([
                                createTextRun('شماره: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(toPersianDigits(contractNo), { bold: true, size: cfg.scaleSize(19), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('تاریخ: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(toPersianDigits(contractDate), { bold: true, size: cfg.scaleSize(19), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('پیوست: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun('چک‌لیست تحویل', { size: cfg.scaleSize(18), color: '334155' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 30 })
                        ]
                    })
                ]
            })
        ]
    });

    const partiesTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [cfg.printableWidth],
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: cfg.printableWidth, type: WidthType.DXA },
                        shading: { fill: 'F8FAFC' },
                        margins: { top: 90, bottom: 90, left: 120, right: 120 },
                        children: [
                            createParagraph([
                                createTextRun('مصالح (واگذارکننده): ', { bold: true, size: cfg.scaleSize(21), color: '1E3A8A' }),
                                createTextRun(contract.releasorName || 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی', { bold: true, size: cfg.scaleSize(21), color: '0F172A' }),
                                createTextRun(' | شناسه ملی: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releasorNationalId || '14012274787'), { bold: true, size: cfg.scaleSize(19) }),
                                createTextRun(' | آدرس: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(contract.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال', { size: cfg.scaleSize(19) }),
                                createTextRun(' | کد پستی: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releasorPostalCode || '7173714734'), { size: cfg.scaleSize(19) }),
                                createTextRun(' | تلفن: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(companyPhone), { size: cfg.scaleSize(19) })
                            ], { spacingBefore: 30, spacingAfter: 30 })
                        ]
                    })
                ]
            }),
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: cfg.printableWidth, type: WidthType.DXA },
                        margins: { top: 90, bottom: 90, left: 120, right: 120 },
                        children: [
                            createParagraph([
                                createTextRun('متصالح (طرف دوم/خریدار): ', { bold: true, size: cfg.scaleSize(21), color: '1E3A8A' }),
                                createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || '................................'}`, { bold: true, size: cfg.scaleSize(21), color: '0F172A' }),
                                createTextRun(' فرزند: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(contract.releaseeFatherName || '..........', { size: cfg.scaleSize(19) }),
                                createTextRun(' | شماره شناسنامه: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releaseeIdNumber) || '..........', { size: cfg.scaleSize(19) }),
                                createTextRun(' | صادره از: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(contract.releaseeIssuePlace || '..........', { size: cfg.scaleSize(19) }),
                                createTextRun(' | کد ملی: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releaseeNationalCode) || '..........', { bold: true, size: cfg.scaleSize(19) }),
                                createTextRun(' | آدرس: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(contract.releaseeAddress || '..................................................', { size: cfg.scaleSize(19) }),
                                createTextRun(' | کدپستی: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releaseePostalCode) || '..........', { size: cfg.scaleSize(19) }),
                                createTextRun(' | تلفن: ', { bold: true, size: cfg.scaleSize(19), color: '475569' }),
                                createTextRun(toPersianDigits(contract.releaseePhone) || '..........', { size: cfg.scaleSize(19) })
                            ], { spacingBefore: 30, spacingAfter: 30 })
                        ]
                    })
                ]
            })
        ]
    });

    const [sCol1, sCol2, sCol3] = cfg.scaleCols([3020, 3030, 3020]);
    const signaturesTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [sCol1, sCol2, sCol3],
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: sCol1, type: WidthType.DXA },
                        shading: { fill: 'F1F5F9' },
                        margins: { top: 80, bottom: 80, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
                        },
                        children: [
                            createParagraph([createTextRun('امضاء و مهر مصالح (فروشنده)', { bold: true, size: cfg.scaleSize(20), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 15 }),
                            createParagraph([createTextRun('شرکت تضامنی حسینی خودرو شیراز', { bold: true, size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.CENTER, spacingAfter: 10 })
                        ]
                    }),
                    new TableCell({
                        width: { size: sCol2, type: WidthType.DXA },
                        shading: { fill: 'F1F5F9' },
                        margins: { top: 80, bottom: 80, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
                        },
                        children: [
                            createParagraph([createTextRun('امضاء و اثر انگشت متصالح (خریدار)', { bold: true, size: cfg.scaleSize(20), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 15 }),
                            createParagraph([createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || '....................'}`, { bold: true, size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.CENTER, spacingAfter: 10 })
                        ]
                    }),
                    new TableCell({
                        width: { size: sCol3, type: WidthType.DXA },
                        shading: { fill: 'F1F5F9' },
                        margins: { top: 80, bottom: 80, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
                        },
                        children: [
                            createParagraph([createTextRun('امضاء و اثر انگشت شهود معامله', { bold: true, size: cfg.scaleSize(20), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 15 }),
                            createParagraph([createTextRun('شاهد اول / شاهد دوم', { size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.CENTER, spacingAfter: 10 })
                        ]
                    })
                ]
            }),
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: sCol1, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' }
                        },
                        children: [
                            createParagraph([createTextRun('شناسه ملی: ۱۴۰۱۲۲۷۴۷۸۷', { size: cfg.scaleSize(16), color: '64748B' })], { alignment: AlignmentType.CENTER, spacingBefore: 30 }),
                            createParagraph([], { spacingBefore: 500 }),
                            createParagraph([createTextRun('[ محل امضاء و مهر رسمی شرکت ]', { size: cfg.scaleSize(15), color: '94A3B8', italics: true })], { alignment: AlignmentType.CENTER, spacingAfter: 20 })
                        ]
                    }),
                    new TableCell({
                        width: { size: sCol2, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' }
                        },
                        children: [
                            createParagraph([createTextRun(`کد ملی: ${toPersianDigits(contract.releaseeNationalCode) || '..........'}`, { size: cfg.scaleSize(16), color: '64748B' })], { alignment: AlignmentType.CENTER, spacingBefore: 30 }),
                            createParagraph([], { spacingBefore: 500 }),
                            createParagraph([createTextRun('[ محل اثر انگشت و امضاء متصالح ]', { size: cfg.scaleSize(15), color: '94A3B8', italics: true })], { alignment: AlignmentType.CENTER, spacingAfter: 20 })
                        ]
                    }),
                    new TableCell({
                        width: { size: sCol3, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' }
                        },
                        children: [
                            createParagraph([createTextRun('امضاء شاهد اول: ......................', { size: cfg.scaleSize(15), color: '64748B' })], { alignment: AlignmentType.CENTER, spacingBefore: 80, spacingAfter: 120 }),
                            createParagraph([createTextRun('امضاء شاهد دوم: ......................', { size: cfg.scaleSize(15), color: '64748B' })], { alignment: AlignmentType.CENTER, spacingAfter: 160 }),
                            createParagraph([createTextRun('[ گواهی صحت و اصالت معامله ]', { size: cfg.scaleSize(15), color: '94A3B8', italics: true })], { alignment: AlignmentType.CENTER, spacingAfter: 20 })
                        ]
                    })
                ]
            })
        ]
    });

    const footerTable = buildOfficialFooterTable(
        'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور',
        `تلفن: ${COMPANY_PHONE_PERSIAN}`,
        cfg
    );
    const runningHeader = buildRunningHeader('قرارداد صلح خودرو', contractNo, cfg);

    const hSize = cfg.scaleSize(22);
    const bSize = cfg.scaleSize(21);
    const cSize = cfg.scaleSize(20);
    const lineSp = paperSize === 'A5' ? 300 : 360;

    const extraNotesParagraphs: Paragraph[] = contract.notes && contract.notes.trim()
        ? [
            createParagraph([createTextRun('ماده ۶- بندهای الحاقی و توضیحات تکمیلی:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 100, spacingAfter: 40 }),
            ...contract.notes.split('\n').filter((l) => l.trim()).map((line) =>
                createParagraph([createTextRun(line.trim(), { size: cSize })], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 })
            )
        ]
        : [];

    const doc = new Document({
        styles: buildDefaultDocStyles(hSize),
        sections: [
            {
                properties: {
                    page: {
                        size: { width: cfg.widthTwips, height: cfg.heightTwips },
                        margin: cfg.margin
                    },
                    titlePage: true
                },
                headers: {
                    first: new Header({ children: [] }),
                    default: new Header({ children: [runningHeader] })
                },
                footers: {
                    first: new Footer({ children: [footerTable] }),
                    default: new Footer({ children: [footerTable] })
                },
                children: [
                    headerTable,
                    createParagraph([], { spacingAfter: 80 }),
                    createParagraph([createTextRun('ماده ۱- طرفین قرارداد (صلح‌نامه):', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 80, spacingAfter: 50 }),
                    partiesTable,
                    createParagraph([createTextRun('ماده ۲- مورد صلح:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 110, spacingAfter: 30 }),
                    createParagraph([
                        createTextRun('یک دستگاه خودروی ', { size: bSize }),
                        createTextRun(contract.carModel || '..........', { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' به شماره شاسی ', { size: bSize }),
                        createTextRun(contract.chassisNumber || '....................', { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' به شماره پلاک انتظامی ', { size: bSize }),
                        createTextRun(contract.plateNumber || '....................', { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' مدل ', { size: bSize }),
                        createTextRun(toPersianDigits(contract.modelYear) || '....', { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' به رنگ ', { size: bSize }),
                        createTextRun(contract.color || '..........', { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' به همراه کلیه متعلقات طبق چک‌لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.', { size: bSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 80 }),
                    createParagraph([createTextRun('ماده ۳- مبلغ مورد صلح و نحوه پرداخت:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 100, spacingAfter: 30 }),
                    createParagraph([
                        createTextRun('مبلغ کل مورد صلح: ', { bold: true, size: bSize }),
                        createTextRun(totalAmountStr, { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' که مبلغ ', { size: bSize }),
                        createTextRun(paidAmountStr, { bold: true, size: bSize, color: '0F172A' }),
                        createTextRun(' به شماره پیگیری/سند ', { size: bSize }),
                        createTextRun(toPersianDigits(contract.trackingNumber) || '....................', { bold: true, size: bSize }),
                        createTextRun(' واریز گردید.', { size: bSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 80 }),
                    createParagraph([createTextRun('ماده ۴- شرایط انتقال سند و تعویض پلاک:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 100, spacingAfter: 30 }),
                    createParagraph([
                        createTextRun('کلیه مخارج انتقال سند و عوارض شهرداری و مالیات نقل و انتقال به عهده متصالح می‌باشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. سند خودرو فوق پس از به نام خوردن به نام مصالح، در دفترخانه اسناد رسمی به صورت وکالت تعویض پلاک به نام متصالح انتقال می‌یابد. متصالح نیز متعهد می‌گردد به محض دریافت وکالت و سند، نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک مصالح را فک نماید؛ در غیر این صورت روزانه مبلغ ۵۰۰ هزار تومان خسارت باید به مصالح پرداخت نماید. این معامله در تاریخ ', { size: cSize }),
                        createTextRun(toPersianDigits(contractDate) || '....................', { bold: true, size: cSize }),
                        createTextRun(' و ساعت ', { size: cSize }),
                        createTextRun(toPersianDigits(contract.transactionTime) || '....:....', { bold: true, size: cSize }),
                        createTextRun(' بصورت قطعی انجام شد و حق فسخ وجود ندارد. ارتکاب هرگونه خلافی از تاریخ تحویل خودرو به عهده متصالح می‌باشد.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 80 }),
                    createParagraph([createTextRun('ماده ۵- شروط و تعهدات تکمیلی قرارداد:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingBefore: 100, spacingAfter: 30 }),
                    createParagraph([
                        createTextRun('۱- ', { bold: true, size: cSize }),
                        createTextRun('کلیه هزینه‌های قراردادی، مالیات‌ها، عوارض، بیمه شخص ثالث، مالیات ارزش افزوده و سایر هزینه‌هایی که قانون یا قرارداد پرداخت آن را به عهده متصالح و مصرف‌کننده گذاشته است، به عهده متصالح می‌باشد. بدیهی است نرخ‌های موارد فوق بر اساس قوانین و توافقات فعلی محاسبه شده است.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۲- ', { bold: true, size: cSize }),
                        createTextRun('متصالح در کمال صحت عقل و اختیار و به موجب مفاد این صلح‌نامه، کافه خیارات خصوصاً خیار غبن ولو فاحش به اعلی مرتبه و نیز هرگونه ادعایی نسبت به خودروی موضوع صلح را از جمله گرانفروشی و غیره و حق هرگونه دعوی و یا شکایت و اعتراض در هر یک از مراجع اداری، انتظامی و قضایی از خود سلب و ساقط نمود.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۳- ', { bold: true, size: cSize }),
                        createTextRun('مرجع رسیدگی به هرگونه شکایت یا دعوی در خصوص این قرارداد شهرستان شیراز می‌باشد.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۴- ', { bold: true, size: cSize }),
                        createTextRun('در صورت بروز هرگونه اختلاف در تفسیر و یا تعبیر یا اجرای این قرارداد(صلحنامه) اعم از اجرای تعهدات، انحلال قرارداد (اقاله، فسخ، انفساخ، بطلان و ابطال و اتمام مدت)، آثار و تبعات و الزامات بعد از انحلال قرارداد، خسارات، تفسیر و غیره بدواً از طریق مذاکره حداکثر ظرف مدت ۱۵ روز حل و فصل خواهد شد و در صورت عدم حصول نتیجه موضوع از طریق داور مرضی‌الطرفین آقای محمد شکرشکن به شماره ملی ۲۲۹۸۹۲۰۰۸۷ با شناسه داوری ۹۸۱۸۸ و عضو کانون داوران استان فارس رسیدگی و حل و فصل می‌گردد. مدت داوری سه ماه و با تشخیص داور مدت سه ماه دیگر نیز قابل افزایش است و رای داور برای طرفین و قائم‌مقام قانونی آنان لازم‌الاتباع است و شرط داوری مستقل از اعتبار و صحت و بقای قرارداد (صلحنامه) است.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۵- ', { bold: true, size: cSize }),
                        createTextRun('اطلاعات حساب بانکی متصالح: شماره حساب ', { size: cSize }),
                        createTextRun(toPersianDigits(contract.releaseeAccountNumber) || '....................', { bold: true, size: cSize }),
                        createTextRun(' شماره شبا ', { size: cSize }),
                        createTextRun(contract.releaseeShebaNumber ? ('IR' + contract.releaseeShebaNumber.replace(/^IR/i, '')) : '........................', { bold: true, size: cSize }),
                        createTextRun(' نزد بانک ', { size: cSize }),
                        createTextRun(contract.releaseeBankName || '..........', { bold: true, size: cSize }),
                        createTextRun(' می‌باشد که پرداخت کلیه ثمن معامله صرفاً از طریق حساب مذکور انجام خواهد شد.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۶- ', { bold: true, size: cSize }),
                        createTextRun('تمامی مکاتبات و تماس و پیامک‌ها به آدرس و شماره همراه مذکور ابلاغ و اعلام می‌گردد. بدیهی است در صورت هرگونه تغییر در آدرس یا شماره تلفن همراه و اطلاعات حساب بانکی فوق‌الذکر متصالح موظف است ظرف مدت ۳ روز مراتب را کتباً به مصالح اعلام نماید. در غیر اینصورت مسئولیت آن متوجه متصالح می‌باشد.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۷- ', { bold: true, size: cSize }),
                        createTextRun('تنظیم صورتجلسه تحویل خودرو به منزله تایید صحت و سلامت خودروی تحویل گرفته شده از سوی مصالح می‌باشد. با این وجود مسئولیت رفع هرگونه ایراد و یا نقص فنی خودرو و جبران خسارات به عهده مراجع و نمایندگی‌های مجاز خدمات پس از فروش شرکت کرمان موتور است و از این حیث هیچ مسئولیتی متوجه مصالح نیست.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 50 }),
                    createParagraph([
                        createTextRun('۸- ', { bold: true, size: cSize }),
                        createTextRun('این صلح‌نامه در تاریخ ', { size: cSize }),
                        createTextRun(toPersianDigits(contractDate) || '....................', { bold: true, size: cSize }),
                        createTextRun(' طبق ماده ۱۰ قانون مدنی در دو نسخه با متن و حکم و اعتبار واحد فی‌مابین طرفین امضا و مبادله شد و مفاد آن برای طرفین لازم‌الاتباع است.', { size: cSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 90 }),
                    ...extraNotesParagraphs,
                    createParagraph([
                        createTextRun('اینجانب ', { bold: true, size: bSize }),
                        createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || '....................'}`, { bold: true, size: bSize, color: '1E3A8A' }),
                        createTextRun(' با مطالعه دقیق قرارداد فوق و علم و آگاهی کامل از مفاد آن با رضایت آن را امضاء نمودم.', { bold: true, size: bSize })
                    ], { spacingBefore: 80, spacingAfter: 140 }),
                    signaturesTable
                ]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const sanitizedNumber = contractNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `قرارداد_صلح_خودرو_${paperSize}_${sanitizedNumber}.docx`);
}

// =========================================================================
// 2. BANK LETTER / SATNA (نامه بانک)
// =========================================================================

export async function exportBankLetterToWord(
    letter: BankLetter,
    paperSize: DocumentPaperSize = 'A4'
): Promise<void> {
    const cfg = getPageLayoutConfig(paperSize);
    const letterNo = letter.letterNumber || '1405/KM2606/---';
    const letterDate = letter.letterDate || '1405/06/22';
    const formattedAmount = formatCurrencyWithCommas(letter.amountRials);
    const amountInWords = letter.amountWords || (numberToPersianWords(letter.amountRials) + ' ریال');
    const branchText = letter.destinationBranchName ? ` ${letter.destinationBranchName}` : '';
    const colorText = letter.carColor ? ` به رنگ ${letter.carColor}` : '';
    const yearText = letter.carModelYear ? ` مدل ${letter.carModelYear}` : '';

    const [hCol1, hCol2, hCol3] = cfg.scaleCols([3400, 2900, 2770]);
    const headerTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [hCol1, hCol2, hCol3],
        margins: { top: 80, bottom: 100, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '1E3A8A' },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: hCol1, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('شرکت حسینی خودرو شیراز', { bold: true, size: cfg.scaleSize(24), color: '1E3A8A' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun('نمایندگی رسمی ۲۶۰۶ کرمان موتور', { bold: true, size: cfg.scaleSize(19), color: '475569' })], { alignment: AlignmentType.RIGHT, spacingAfter: 30 })
                        ]
                    }),
                    new TableCell({
                        width: { size: hCol2, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([createTextRun('بنام خدا', { bold: true, size: cfg.scaleSize(26), color: '0F172A' })], { alignment: AlignmentType.CENTER, spacingAfter: 30 })
                        ]
                    }),
                    new TableCell({
                        width: { size: hCol3, type: WidthType.DXA },
                        margins: { top: 60, bottom: 80, left: 50, right: 50 },
                        children: [
                            createParagraph([
                                createTextRun('شماره: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(letterNo, { bold: true, size: cfg.scaleSize(19), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('تاریخ: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun(toPersianDigits(letterDate), { bold: true, size: cfg.scaleSize(19), color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('پیوست: ', { bold: true, size: cfg.scaleSize(18), color: '64748B' }),
                                createTextRun('ندارد', { size: cfg.scaleSize(18), color: '475569' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 30 })
                        ]
                    })
                ]
            })
        ]
    });

    const [sigCol1, sigCol2] = cfg.scaleCols([4400, 4670]);
    const signatureTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [sigCol1, sigCol2],
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: sigCol1, type: WidthType.DXA },
                        shading: { fill: 'F8FAFC' },
                        margins: { top: 120, bottom: 120, left: 120, right: 120 },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
                            left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
                            right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' }
                        },
                        children: [
                            createParagraph([createTextRun('اصالت‌سنجی نامه اداری', { bold: true, size: cfg.scaleSize(18), color: '334155' })], { alignment: AlignmentType.RIGHT, spacingAfter: 25 }),
                            createParagraph([createTextRun(`کد یکتای پیگیری: ${letterNo}`, { bold: true, size: cfg.scaleSize(17), color: '475569' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun('سامانه جامع نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو)', { size: cfg.scaleSize(16), color: '64748B' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 }),
                            createParagraph([createTextRun('این نامه صرفاً جهت ارائه به بانک جهت انتقال وجه ساتنا معتبر است.', { italics: true, size: cfg.scaleSize(15), color: '94A3B8' })], { alignment: AlignmentType.RIGHT, spacingAfter: 20 })
                        ]
                    }),
                    new TableCell({
                        width: { size: sigCol2, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 80, right: 80 },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE }
                        },
                        children: [
                            createParagraph([createTextRun('با تشکر و احترام', { bold: true, size: cfg.scaleSize(21), color: '334155' })], { alignment: AlignmentType.CENTER, spacingAfter: 30 }),
                            createParagraph([createTextRun(letter.dealershipName || 'نمایندگی ۲۶۰۶ کرمان موتور', { bold: true, size: cfg.scaleSize(23), color: '1E3A8A' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([createTextRun('(شرکت حسینی خودرو شیراز)', { size: cfg.scaleSize(18), color: '64748B' })], { alignment: AlignmentType.CENTER, spacingAfter: 500 }),
                            createParagraph([createTextRun('[ محل امضاء و مهر رسمی نمایندگی ]', { italics: true, size: cfg.scaleSize(17), color: '94A3B8' })], { alignment: AlignmentType.CENTER, spacingAfter: 20 })
                        ]
                    })
                ]
            })
        ]
    });

    const footerTable = buildOfficialFooterTable(
        'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور',
        `تلفن تماس: ${COMPANY_PHONE_PERSIAN}`,
        cfg
    );
    const runningHeader = buildRunningHeader('نامه معرفی به بانک', letterNo, cfg);

    const bSize = cfg.scaleSize(22);
    const lineSp = paperSize === 'A5' ? 350 : 420;

    const extraNotes = letter.notes && letter.notes.trim()
        ? letter.notes.split('\n').filter((l) => l.trim()).map((line) =>
            createParagraph([createTextRun(line.trim(), { size: bSize, color: '334155' })], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 80 })
        )
        : [];

    const doc = new Document({
        styles: buildDefaultDocStyles(bSize),
        sections: [
            {
                properties: {
                    page: {
                        size: { width: cfg.widthTwips, height: cfg.heightTwips },
                        margin: cfg.margin
                    },
                    titlePage: true
                },
                headers: {
                    first: new Header({ children: [] }),
                    default: new Header({ children: [runningHeader] })
                },
                footers: {
                    first: new Footer({ children: [footerTable] }),
                    default: new Footer({ children: [footerTable] })
                },
                children: [
                    headerTable,
                    createParagraph([], { spacingAfter: paperSize === 'A5' ? 100 : 160 }),
                    createParagraph([
                        createTextRun(`ریاست محترم ${letter.destinationBankName || 'بانک ...'}${branchText}`, { bold: true, size: cfg.scaleSize(25), color: '0F172A' })
                    ], { spacingBefore: 100, spacingAfter: 40 }),
                    createParagraph([
                        createTextRun('با سلام و احترام،', { bold: true, size: bSize, color: '334155' })
                    ], { spacingAfter: 140 }),
                    createParagraph([
                        createTextRun('احتراماً ', { size: bSize }),
                        createTextRun(letter.customerTitle || 'خانم/آقای', { bold: true, size: bSize }),
                        createTextRun(' ', { size: bSize }),
                        createTextRun(letter.customerName || '....................', { bold: true, size: bSize, color: '1E3A8A' }),
                        createTextRun(' به کدملی ', { size: bSize }),
                        createTextRun(toPersianDigits(letter.customerNationalCode) || '..........', { bold: true, size: bSize }),
                        createTextRun(' جهت امور بانکی و واریز وجه به مبلغ ', { size: bSize }),
                        createTextRun(`${toPersianDigits(formattedAmount || '0')} ریال`, { bold: true, size: bSize, color: '1E3A8A' }),
                        createTextRun(` (${amountInWords}) `, { size: cfg.scaleSize(21), color: '475569' }),
                        createTextRun(letter.paymentMethod || 'بصورت حواله ساتنا', { bold: true, size: bSize }),
                        createTextRun(' به شماره شبا ', { size: bSize }),
                        createTextRun(letter.shebaNumber || '........................', { bold: true, size: bSize, color: '065F46' }),
                        createTextRun(' نزد ', { size: bSize }),
                        createTextRun(letter.beneficiaryBankName || 'بانک ...', { bold: true, size: bSize }),
                        createTextRun(' بنام ', { size: bSize }),
                        createTextRun(letter.accountHolderName || 'شرکت حسینی خودرو شیراز', { bold: true, size: bSize, color: '1E3A8A' }),
                        createTextRun(' جهت خرید یک دستگاه ', { size: bSize }),
                        createTextRun(letter.carModel || '...', { bold: true, size: bSize }),
                        createTextRun(yearText, { bold: true, size: bSize }),
                        createTextRun(colorText, { bold: true, size: bSize }),
                        createTextRun(' به خدمت حضورتان معرفی می‌گردند.', { size: bSize })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 160 }),
                    createParagraph([
                        createTextRun('خواهشمند است بذل لطف نموده همکاری‌های لازم با نامبرده را مبذول فرمایید.', { size: bSize, color: '1E293B' })
                    ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: extraNotes.length > 0 ? 120 : 360 }),
                    ...extraNotes,
                    ...(extraNotes.length > 0 ? [createParagraph([], { spacingAfter: 200 })] : []),
                    signatureTable
                ]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const sanitizedNumber = letterNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `نامه_بانک_${paperSize}_${sanitizedNumber}.docx`);
}

// =========================================================================
// 3. PRE-CONTRACT FORM (فرم پیش قرارداد)
// =========================================================================

export async function exportPreContractToWord(
    form: PreContractForm,
    paperSize: DocumentPaperSize = 'A4'
): Promise<void> {
    const cfg = getPageLayoutConfig(paperSize);
    const docNo = form.contractNumber || '1405/PRE-1001';
    const docDate = form.contractDate || '1405/06/22';
    const totalWords = form.totalPriceRials > 0 ? ` (${numberToPersianWords(form.totalPriceRials)} ریال)` : '';
    const totalFmt = form.totalPriceRials > 0 ? toPersianDigits(formatCurrencyWithCommas(form.totalPriceRials)) : '...............................';
    const prepayWords = form.prepaymentRials > 0 ? ` (${numberToPersianWords(form.prepaymentRials)} ریال)` : '';
    const prepayFmt = form.prepaymentRials > 0 ? toPersianDigits(formatCurrencyWithCommas(form.prepaymentRials)) : '................................';

    const headerTable = buildGenericHeaderTable('فرم پیش قرارداد', 'نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو شیراز)', docNo, docDate, cfg);
    const footerTable = buildOfficialFooterTable('شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور', `تلفن: ${COMPANY_PHONE_PERSIAN}`, cfg);
    const runningHeader = buildRunningHeader('فرم پیش قرارداد', docNo, cfg);

    const [sigCol1, sigCol2] = cfg.scaleCols([4535, 4535]);
    const sigTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [sigCol1, sigCol2],
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: sigCol1, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [
                            createParagraph([createTextRun('نام و امضای خریدار', { bold: true, size: cfg.scaleSize(22), color: '0F172A' })], { alignment: AlignmentType.CENTER, spacingAfter: 350 }),
                            createParagraph([createTextRun(`${form.buyerTitle || ''} ${form.buyerName || '....................'}`, { size: cfg.scaleSize(19), color: '475569' })], { alignment: AlignmentType.CENTER })
                        ]
                    }),
                    new TableCell({
                        width: { size: sigCol2, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [
                            createParagraph([createTextRun('اثر انگشت', { bold: true, size: cfg.scaleSize(22), color: '0F172A' })], { alignment: AlignmentType.CENTER, spacingAfter: 350 }),
                            createParagraph([createTextRun('[ محل اثر انگشت ]', { size: cfg.scaleSize(17), color: '94A3B8', italics: true })], { alignment: AlignmentType.CENTER })
                        ]
                    })
                ]
            })
        ]
    });

    const bSize = cfg.scaleSize(22);
    const lineSp = paperSize === 'A5' ? 330 : 400;

    const doc = new Document({
        styles: buildDefaultDocStyles(bSize),
        sections: [{
            properties: {
                page: { size: { width: cfg.widthTwips, height: cfg.heightTwips }, margin: cfg.margin },
                titlePage: true
            },
            headers: {
                first: new Header({ children: [] }),
                default: new Header({ children: [runningHeader] })
            },
            footers: {
                first: new Footer({ children: [footerTable] }),
                default: new Footer({ children: [footerTable] })
            },
            children: [
                headerTable,
                createParagraph([], { spacingAfter: 120 }),
                createParagraph([createTextRun('مشخصات خریدار:', { bold: true, size: cfg.scaleSize(24), color: '1E3A8A' })], { spacingAfter: 80 }),
                createParagraph([
                    createTextRun('اینجانب ', { size: bSize }),
                    createTextRun(`${form.buyerTitle || 'خانم / آقای'} ${form.buyerName || '.................................'}`, { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(' فرزند ', { size: bSize }),
                    createTextRun(form.buyerFatherName || '............................', { bold: true, size: bSize }),
                    createTextRun(' به کدملی ', { size: bSize }),
                    createTextRun(toPersianDigits(form.buyerNationalCode) || '.........................', { bold: true, size: bSize }),
                    createTextRun(' متقاضی خرید یک دستگاه خودرو ', { size: bSize }),
                    createTextRun(form.carModel || '...............................', { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(' مدل ', { size: bSize }),
                    createTextRun(toPersianDigits(form.modelYear) || '..................', { bold: true, size: bSize }),
                    createTextRun(' رنگ ', { size: bSize }),
                    createTextRun(form.color || '................', { bold: true, size: bSize }),
                    createTextRun(' در نمایندگی ۲۶۰۶ حسینی می‌باشم.', { size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 120 }),
                createParagraph([
                    createTextRun('- ثمن مورد معامله به مبلغ ', { size: bSize }),
                    createTextRun(`${totalFmt} ریال`, { bold: true, size: bSize, color: '065F46' }),
                    createTextRun(`${totalWords} مورد تایید اینجانب می‌باشد.`, { size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 100 }),
                createParagraph([
                    createTextRun('- متعهد می‌گردم همزمان با این درخواست، مبلغ ', { size: bSize }),
                    createTextRun(`${prepayFmt} ریال`, { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(`${prepayWords} به عنوان پیش‌پرداخت به حساب کرمان موتور ۲۶۰۶ حسینی واریز نمایم.`, { size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 100 }),
                createParagraph([
                    createTextRun('- الباقی ثمن معامله مورخ ', { size: bSize }),
                    createTextRun(toPersianDigits(form.remainingPaymentDate) || '..........................', { bold: true, size: bSize, color: 'B45309' }),
                    createTextRun(' پرداخت می‌گردد. در صورت عدم پرداخت مابقی وجه در موعد مقرر معامله به صورت یکطرفه از سوی فروشنده فسخ خواهد شد.', { size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 100 }),
                createParagraph([
                    createTextRun('- چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت حسینی خودرو شیراز مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت ۳۰ روز به اینجانب اعاده نماید.', { size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 280 }),
                sigTable
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `پیش_قرارداد_${paperSize}_${docNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`);
}

// =========================================================================
// 4. REMITTANCE FINAL APPROVAL FORM (فرم تایید نهایی حواله)
// =========================================================================

export async function exportRemittanceApprovalToWord(
    form: RemittanceApprovalForm,
    paperSize: DocumentPaperSize = 'A4'
): Promise<void> {
    const cfg = getPageLayoutConfig(paperSize);
    const docNo = form.formNumber || '1405/REM-1001';
    const docDate = form.formDate || '1405/06/22';
    const totalFmt = form.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.totalAmountRials))} ریال` : '......................................';
    const paidFmt = form.paidAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.paidAmountRials))} ریال` : '................................';
    const remFmt = form.remainingAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.remainingAmountRials))} ریال` : (form.totalAmountRials > 0 && form.paidAmountRials >= form.totalAmountRials ? '۰ ریال (تسویه کامل)' : '.................................');

    const headerTable = buildGenericHeaderTable('فرم تایید نهایی حواله', 'نمایندگی حسینی خودرو شیراز (کد ۲۶۰۶)', docNo, docDate, cfg);
    const footerTable = buildOfficialFooterTable('شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور', `تلفن: ${COMPANY_PHONE_PERSIAN}`, cfg);
    const runningHeader = buildRunningHeader('فرم تایید نهایی حواله', docNo, cfg);

    const checkBox = (checked: boolean) => (checked ? '☑' : '☐');
    const hSize = cfg.scaleSize(23);
    const bSize = cfg.scaleSize(21);

    const doc = new Document({
        styles: buildDefaultDocStyles(bSize),
        sections: [{
            properties: {
                page: { size: { width: cfg.widthTwips, height: cfg.heightTwips }, margin: cfg.margin },
                titlePage: true
            },
            headers: {
                first: new Header({ children: [] }),
                default: new Header({ children: [runningHeader] })
            },
            footers: {
                first: new Footer({ children: [footerTable] }),
                default: new Footer({ children: [footerTable] })
            },
            children: [
                headerTable,
                createParagraph([], { spacingAfter: 90 }),
                createParagraph([createTextRun('۱. مشخصات خودرو:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingAfter: 50 }),
                createParagraph([
                    createTextRun(`نوع خودرو: ${form.carModel || '……………………'}     |     رنگ: ${form.color || '……………………'}     |     زمان تحویل: ${toPersianDigits(form.deliveryTime) || '……………………'}`, { size: bSize })
                ], { spacingAfter: 100 }),
                createParagraph([createTextRun('۲. اطلاعات مشتری:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingAfter: 50 }),
                createParagraph([
                    createTextRun(`نام و نام خانوادگی: ${form.customerName || '.............................'}     |     کدملی: ${toPersianDigits(form.customerNationalCode) || '......................'}     |     شماره تماس: ${toPersianDigits(form.customerPhone) || '.....................'}`, { size: bSize })
                ], { spacingAfter: 120 }),
                createParagraph([createTextRun('۳. کنترل وضعیت مالی (مسئولیت کامل با حسابداری):', { bold: true, size: hSize, color: '1E3A8A' })], { spacingAfter: 50 }),
                createParagraph([createTextRun(`${checkBox(form.accCheckNoDebt)} هیچگونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است`, { size: bSize })], { spacingAfter: 30 }),
                createParagraph([createTextRun(`${checkBox(form.accCheckMatched)} کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است`, { size: bSize })], { spacingAfter: 30 }),
                createParagraph([createTextRun(`${checkBox(form.accCheckClear)} حواله خودرو از نظر مالی بلامانع است`, { size: bSize })], { spacingAfter: 60 }),
                createParagraph([
                    createTextRun(`مبلغ کل: ${totalFmt}     |     مبلغ واریزی: ${paidFmt}     |     مانده حساب: ${remFmt}`, { bold: true, size: bSize, color: '065F46' })
                ], { spacingAfter: 60 }),
                createParagraph([
                    createTextRun(`نام مسئول حسابداری: ${form.accountingManagerName || '....................'}          امضا و تاریخ: ${toPersianDigits(form.accountingDate) || '....................'}`, { bold: true, size: bSize })
                ], { spacingAfter: 130 }),
                createParagraph([createTextRun('۴. کنترل وضعیت فروش (مسئولیت کامل با مسئول فروش):', { bold: true, size: hSize, color: '1E3A8A' })], { spacingAfter: 50 }),
                createParagraph([createTextRun(`${checkBox(form.salesCheckCorrect)} اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است`, { size: bSize })], { spacingAfter: 30 }),
                createParagraph([createTextRun(`${checkBox(form.salesCheckInvoice)} مبلغ فاکتور، تخفیف‌ها، شرایط فروش و مانده حساب کنترل شد`, { size: bSize })], { spacingAfter: 50 }),
                createParagraph([
                    createTextRun(`نام مسئول فروش: ${form.salesManagerName || '...........................'}          امضا و تاریخ: ${toPersianDigits(form.salesDate) || '....................'}`, { bold: true, size: bSize })
                ], { spacingAfter: 30 }),
                createParagraph([createTextRun(`توضیحات: ${form.salesNotes || '..............................................'}`, { size: bSize })], { spacingAfter: 130 }),
                createParagraph([createTextRun('۵. مدیریت تأیید می‌کند:', { bold: true, size: hSize, color: '1E3A8A' })], { spacingAfter: 50 }),
                createParagraph([createTextRun(`${checkBox(form.mgmtCheckSignatures)} تمامی امضاها کنترل`, { size: bSize })], { spacingAfter: 50 }),
                createParagraph([createTextRun(`مسئولیت فروش با: ${form.salesResponsibilityWith || '......................................'}`, { bold: true, size: cfg.scaleSize(22) })], { spacingAfter: 160 })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `تایید_نهایی_حواله_${paperSize}_${docNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`);
}

// =========================================================================
// 5. FREE BILL OF SALE (قولنامه آزاد)
// =========================================================================

export async function exportFreeBillToWord(
    form: FreeBillOfSale,
    paperSize: DocumentPaperSize = 'A4'
): Promise<void> {
    const cfg = getPageLayoutConfig(paperSize);
    const docNo = form.contractNumber || '1405/FB-1001';
    const docDate = form.contractDate || '1405/06/22';
    const amountWords = form.totalAmountRials > 0 ? ` (${numberToPersianWords(form.totalAmountRials)} ریال)` : '';
    const amountFmt = form.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(form.totalAmountRials))} ریال${amountWords}` : '................................................................';

    const headerTable = buildGenericHeaderTable('قولنامه آزاد', 'مبایعه‌نامه رسمی خودرو', docNo, docDate, cfg);
    const footerTable = buildOfficialFooterTable('شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور', `تلفن: ${COMPANY_PHONE_PERSIAN}`, cfg);
    const runningHeader = buildRunningHeader('قولنامه آزاد', docNo, cfg);

    const [sigCol1, sigCol2, sigCol3] = cfg.scaleCols([3023, 3024, 3023]);
    const sigTable = new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: cfg.printableWidth, type: WidthType.DXA },
        columnWidths: [sigCol1, sigCol2, sigCol3],
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' }
        },
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: sigCol1, type: WidthType.DXA },
                        margins: { top: 80, bottom: 80, left: 60, right: 60 },
                        children: [
                            createParagraph([createTextRun('امضاء فروشنده', { bold: true, size: cfg.scaleSize(21) })], { alignment: AlignmentType.CENTER, spacingAfter: 300 }),
                            createParagraph([createTextRun(`${form.sellerTitle || ''} ${form.sellerName || '..........'}`, { size: cfg.scaleSize(18), color: '475569' })], { alignment: AlignmentType.CENTER })
                        ]
                    }),
                    new TableCell({
                        width: { size: sigCol2, type: WidthType.DXA },
                        margins: { top: 80, bottom: 80, left: 60, right: 60 },
                        children: [
                            createParagraph([createTextRun('امضاء خریدار', { bold: true, size: cfg.scaleSize(21) })], { alignment: AlignmentType.CENTER, spacingAfter: 300 }),
                            createParagraph([createTextRun(`${form.buyerTitle || ''} ${form.buyerName || '..........'}`, { size: cfg.scaleSize(18), color: '475569' })], { alignment: AlignmentType.CENTER })
                        ]
                    }),
                    new TableCell({
                        width: { size: sigCol3, type: WidthType.DXA },
                        margins: { top: 80, bottom: 80, left: 60, right: 60 },
                        children: [
                            createParagraph([createTextRun('امضاء شاهد', { bold: true, size: cfg.scaleSize(21) })], { alignment: AlignmentType.CENTER, spacingAfter: 300 }),
                            createParagraph([createTextRun('نام و امضاء', { size: cfg.scaleSize(18), color: '94A3B8' })], { alignment: AlignmentType.CENTER })
                        ]
                    })
                ]
            })
        ]
    });

    const bSize = cfg.scaleSize(21);
    const tSize = cfg.scaleSize(20);
    const lineSp = paperSize === 'A5' ? 300 : 360;

    const doc = new Document({
        styles: buildDefaultDocStyles(bSize),
        sections: [{
            properties: {
                page: { size: { width: cfg.widthTwips, height: cfg.heightTwips }, margin: cfg.margin },
                titlePage: true
            },
            headers: {
                first: new Header({ children: [] }),
                default: new Header({ children: [runningHeader] })
            },
            footers: {
                first: new Footer({ children: [footerTable] }),
                default: new Footer({ children: [footerTable] })
            },
            children: [
                headerTable,
                createParagraph([], { spacingAfter: 100 }),
                createParagraph([
                    createTextRun('فروشنده: ', { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(`${form.sellerTitle || 'خانم/آقای'} ${form.sellerName || '................'} فرزند ${form.sellerFatherName || '........'} به شماره شناسنامه ${toPersianDigits(form.sellerIdNumber) || '........'} صادره از ${form.sellerIssuePlace || '........'} کد ملی ${toPersianDigits(form.sellerNationalCode) || '................'} آدرس: ${form.sellerAddress || '................................'} کد پستی: ${toPersianDigits(form.sellerPostalCode) || '........'} تلفن: ${toPersianDigits(form.sellerPhone) || '........'}`, { size: tSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 70 }),
                createParagraph([
                    createTextRun('خریدار: ', { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(`${form.buyerTitle || 'خانم/آقای'} ${form.buyerName || '................'} فرزند ${form.buyerFatherName || '........'} به شماره شناسنامه ${toPersianDigits(form.buyerIdNumber) || '........'} صادره از ${form.buyerIssuePlace || '........'} کد ملی ${toPersianDigits(form.buyerNationalCode) || '................'} آدرس: ${form.buyerAddress || '................................'} کدپستی: ${toPersianDigits(form.buyerPostalCode) || '........'} تلفن: ${toPersianDigits(form.buyerPhone) || '........'}`, { size: tSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 90 }),
                createParagraph([
                    createTextRun('مورد معامله: ', { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(`یکدستگاه خودروی ${form.carModel || '................'} به شماره بدنه: ${form.chassisNumber || '................'} به رنگ: ${form.color || '........'} شماره شهربانی: ${form.plateNumber || '................'}`, { bold: true, size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 70 }),
                createParagraph([
                    createTextRun('مبلغ مورد معامله: ', { bold: true, size: bSize, color: '065F46' }),
                    createTextRun(amountFmt + (form.totalAmountDescription ? ` - ${form.totalAmountDescription}` : ''), { bold: true, size: bSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 90 }),
                createParagraph([
                    createTextRun('توضیحات: ', { bold: true, size: bSize, color: '1E3A8A' }),
                    createTextRun(`کلیه مخارج عوارض شهرداری و مالیات نقل و انتقال به عهده خریدار میباشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. فروشنده متعهد میگردد که ظرف مدت ۱۰ روز در دفترخانه اسناد رسمی حاضر و وکالت تعویض پلاک را به نام خریدار تنظیم نماید در غیر اینصورت روزانه مبلغ ۵۰۰ هزار تومان می بایست فروشنده به خریدار پرداخت نماید. خریدار نیز متعهد می گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک فروشنده را فک نماید. این معامله در تاریخ ${toPersianDigits(form.contractDate) || '..........'} و ساعت ${toPersianDigits(form.transactionTime) || '....:....'} بصورت قطعی انجام شد و حق فسخ ندارد. کشف فساد و خلافی تا این تاریخ به عهده فروشنده می باشد و از این تاریخ به بعد به عهده خریدار می باشد. خریدار از کم و کیف خودرو اطلاع داشته و خودرو صحیح و سالم به رویت کامل ایشان رسید. قیمت معامله براساس قیمت روز و شرایط وضعیت موجود بوده و خریدار با علم و اطلاع اقدام به خرید کرده اند و نوسانات قیمت هیچ گونه تاثیری در مبایعه نامه ندارد و هرگونه ادعائی در حال و آینده از خود سلب می نماید. فروشنده و خریدار با امضا ذیل مبایعه نامه از کلیه مفاد قرارداد و مبایعه نامه مطلع و آگاه شده اند و با اراده شخصی و با علم و آگاهی از کم و کیف خودرو مورد معامله و اوضاع و احوال و زمان و مکان و نیز رضایت از ثمن معامله بین طرفین منعقد گردید. تمام کافه خیارات بخصوص غبن فاحش و تدلیس از طرفین ساقط گردید. مرجع رسیدگی به هرگونه شکایت در خصوص این مبایعه نامه شهرستان شیراز می باشد. چنانچه خریدار ظرف مدت مقرر در وکالت، تعویض پلاک ننماید از زمان اتمام تاریخ وکالت اولیه تا تاریخ تعویض پلاک روزانه مبلغ ۵۰۰ هزار تومان میبایست خریدار به فروشنده پرداخت نماید و هزینه وکالت مجدد با خریدار می باشد. تمامی مدارک خودرو اعم از ${form.deliveredDocuments || '................................'} تحویل خریدار گردید.`, { size: tSize })
                ], { alignment: AlignmentType.JUSTIFIED, lineSpacing: lineSp, spacingAfter: 240 }),
                sigTable
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `قولنامه_آزاد_${paperSize}_${docNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`);
}
