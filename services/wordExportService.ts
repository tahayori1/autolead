/**
 * Word (.docx) Export Service for Peace Contracts and Bank Letters
 * Generates beautiful Right-to-Left (RTL) Microsoft Word documents with Arial font,
 * official letterheads (Headers), legal body tables, and footers (Footers).
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
import type { CarPeaceContract, BankLetter } from '../types/bankLetter';
import {
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from './bankLetterValidation';

const FONT_ARIAL = 'Arial';

/**
 * Triggers a browser download for a Blob
 */
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

/**
 * Helper to build an RTL Arial TextRun
 */
function createTextRun(text: string, options: {
    bold?: boolean;
    size?: number; // half-points: 22 = 11pt, 24 = 12pt, 28 = 14pt
    color?: string;
    italics?: boolean;
} = {}): TextRun {
    return new TextRun({
        text,
        font: FONT_ARIAL,
        rightToLeft: true,
        bold: options.bold ?? false,
        size: options.size ?? 22,
        color: options.color ?? '1E293B',
        italics: options.italics ?? false
    });
}

/**
 * Helper to build an RTL Arial Paragraph
 */
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
            before: options.spacingBefore ?? 60,
            after: options.spacingAfter ?? 100,
            line: options.lineSpacing ?? 360 // 1.5 line spacing
        },
        children
    });
}

// =========================================================================
// 1. CAR PEACE CONTRACT (قرارداد صلح خودرو)
// =========================================================================

export async function exportPeaceContractToWord(contract: CarPeaceContract): Promise<void> {
    const contractNo = contract.contractNumber || '1405/PC-1001';
    const contractDate = contract.contractDate || '1405/06/22';
    const totalAmountStr = contract.totalAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(contract.totalAmountRials))} ریال (${numberToPersianWords(contract.totalAmountRials)} ریال)`
        : '........................ ریال';
    const paidAmountStr = contract.paidAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(contract.paidAmountRials))} ریال`
        : (contract.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(contract.totalAmountRials))} ریال` : '........................ ریال');

    // Official Header (سربرگ)
    const headerTable = new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.SINGLE, size: 12, color: '1E3A8A' } // Strong blue divider
        },
        rows: [
            new TableRow({
                children: [
                    // Right Cell: Company Name & Dealership
                    new TableCell({
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('شرکت تضامنی حسینی خودرو شیراز', { bold: true, size: 21, color: '0F172A' })
                            ], { spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('نمایندگی رسمی کرمان موتور - کد ۲۶۰۶', { bold: false, size: 18, color: '475569' })
                            ], { spacingAfter: 40 })
                        ]
                    }),
                    // Center Cell: Title
                    new TableCell({
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('بسمه تعالی', { bold: true, size: 22, color: '0F172A' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('قرارداد صلح خودرو', { bold: true, size: 28, color: '1E3A8A' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 40 })
                        ]
                    }),
                    // Left Cell: Metadata
                    new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('شماره: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun(toPersianDigits(contractNo), { bold: true, size: 19, color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('تاریخ: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun(toPersianDigits(contractDate), { bold: true, size: 19, color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('پیوست: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun('چک‌لیست تحویل', { bold: false, size: 18, color: '334155' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 40 })
                        ]
                    })
                ]
            })
        ]
    });

    // Official Footer (پانوشت)
    const footerParagraph = createParagraph([
        createTextRun('شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال - نمایندگی ۲۶۰۶ کرمان موتور | تلفن: ۰۹۳۷۰۵۱۸۵۳۸ | سامانه اتولید حسینی خودرو شیراز  —  صفحه ', { size: 16, color: '64748B' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT_ARIAL, size: 16 }),
        createTextRun(' از ', { size: 16, color: '64748B' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_ARIAL, size: 16 })
    ], { alignment: AlignmentType.CENTER });

    // Table of Parties (ماده ۱ - طرفین قرارداد)
    const partiesTable = new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            // Row 1: Releasor (مصالح)
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        children: [
                            createParagraph([
                                createTextRun('مصالح: ', { bold: true, size: 21, color: '1E3A8A' }),
                                createTextRun(contract.releasorName || 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی', { bold: true, size: 21 }),
                                createTextRun(' | شناسه ملی: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releasorNationalId || '14012274787'), { size: 19 }),
                                createTextRun(' | آدرس: ', { bold: true, size: 19 }),
                                createTextRun(contract.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال', { size: 19 }),
                                createTextRun(' | کد پستی: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releasorPostalCode || '7173714734'), { size: 19 }),
                                createTextRun(' | تلفن: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releasorPhone || '09370518538'), { size: 19 })
                            ], { spacingBefore: 60, spacingAfter: 60 })
                        ]
                    })
                ]
            }),
            // Row 2: Releasee (متصالح)
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        children: [
                            createParagraph([
                                createTextRun('متصالح: ', { bold: true, size: 21, color: '1E3A8A' }),
                                createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || '................................'}`, { bold: true, size: 21 }),
                                createTextRun(' فرزند: ', { bold: true, size: 19 }),
                                createTextRun(contract.releaseeFatherName || '..........', { size: 19 }),
                                createTextRun(' | شماره شناسنامه: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releaseeIdNumber) || '..........', { size: 19 }),
                                createTextRun(' | صادره از: ', { bold: true, size: 19 }),
                                createTextRun(contract.releaseeIssuePlace || '..........', { size: 19 }),
                                createTextRun(' | کد ملی: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releaseeNationalCode) || '..........', { bold: true, size: 19 }),
                                createTextRun(' | آدرس: ', { bold: true, size: 19 }),
                                createTextRun(contract.releaseeAddress || '..................................................', { size: 19 }),
                                createTextRun(' | کدپستی: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releaseePostalCode) || '..........', { size: 19 }),
                                createTextRun(' | تلفن: ', { bold: true, size: 19 }),
                                createTextRun(toPersianDigits(contract.releaseePhone) || '..........', { size: 19 })
                            ], { spacingBefore: 60, spacingAfter: 60 })
                        ]
                    })
                ]
            })
        ]
    });

    // Signatures Table
    const signaturesTable = new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            createParagraph([
                                createTextRun('امضاء و مهر مصالح', { bold: true, size: 20, color: '1E3A8A' })
                            ], { alignment: AlignmentType.CENTER, spacingBefore: 60, spacingAfter: 40 }),
                            createParagraph([
                                createTextRun('شرکت تضامنی حسینی خودرو شیراز', { size: 18, color: '64748B' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 600 }) // space for physical signature
                        ]
                    }),
                    new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        children: [
                            createParagraph([
                                createTextRun('امضاء و اثر انگشت متصالح', { bold: true, size: 20, color: '1E3A8A' })
                            ], { alignment: AlignmentType.CENTER, spacingBefore: 60, spacingAfter: 40 }),
                            createParagraph([
                                createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || ''}`, { size: 18, color: '64748B' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 600 })
                        ]
                    }),
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            createParagraph([
                                createTextRun('امضاء شهود معامله', { bold: true, size: 20, color: '1E3A8A' })
                            ], { alignment: AlignmentType.CENTER, spacingBefore: 60, spacingAfter: 40 }),
                            createParagraph([
                                createTextRun('شاهد اول / شاهد دوم', { size: 18, color: '64748B' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 600 })
                        ]
                    })
                ]
            })
        ]
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: FONT_ARIAL, size: 22, color: '1E293B', rightToLeft: true }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1200, bottom: 1200, right: 1400, left: 1400 } // standard margins in twips
                    }
                },
                headers: {
                    default: new Header({ children: [headerTable] })
                },
                footers: {
                    default: new Footer({ children: [footerParagraph] })
                },
                children: [
                    // Spacing after header
                    createParagraph([], { spacingAfter: 120 }),

                    // Section: Parties (ماده ۱ - طرفین قرارداد)
                    createParagraph([
                        createTextRun('ماده ۱- طرفین قرارداد (صلح‌نامه):', { bold: true, size: 22, color: '1E3A8A' })
                    ], { spacingBefore: 100, spacingAfter: 60 }),
                    partiesTable,

                    // Section: Subject (ماده ۲ - مورد صلح)
                    createParagraph([
                        createTextRun('ماده ۲- مورد صلح:', { bold: true, size: 22, color: '1E3A8A' })
                    ], { spacingBefore: 120, spacingAfter: 40 }),
                    createParagraph([
                        createTextRun('یک دستگاه خودروی ', { size: 21 }),
                        createTextRun(contract.carModel || '..........', { bold: true, size: 21 }),
                        createTextRun(' به شماره شاسی ', { size: 21 }),
                        createTextRun(contract.chassisNumber || '....................', { bold: true, size: 21 }),
                        createTextRun(' به شماره پلاک انتظامی ', { size: 21 }),
                        createTextRun(contract.plateNumber || '....................', { bold: true, size: 21 }),
                        createTextRun(' مدل ', { size: 21 }),
                        createTextRun(toPersianDigits(contract.modelYear) || '....', { bold: true, size: 21 }),
                        createTextRun(' به رنگ ', { size: 21 }),
                        createTextRun(contract.color || '..........', { bold: true, size: 21 }),
                        createTextRun(' به همراه کلیه متعلقات طبق چک‌لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.', { size: 21 })
                    ], { spacingAfter: 100 }),

                    // Section: Amount (ماده ۳ - مبلغ مورد صلح)
                    createParagraph([
                        createTextRun('ماده ۳- مبلغ مورد صلح و نحوه پرداخت:', { bold: true, size: 22, color: '1E3A8A' })
                    ], { spacingBefore: 120, spacingAfter: 40 }),
                    createParagraph([
                        createTextRun('مبلغ کل مورد صلح: ', { bold: true, size: 21 }),
                        createTextRun(totalAmountStr, { bold: true, size: 21, color: '0F172A' }),
                        createTextRun(' که مبلغ ', { size: 21 }),
                        createTextRun(paidAmountStr, { bold: true, size: 21 }),
                        createTextRun(' به شماره پیگیری/سند ', { size: 21 }),
                        createTextRun(toPersianDigits(contract.trackingNumber) || '....................', { bold: true, size: 21 }),
                        createTextRun(' واریز گردید.', { size: 21 })
                    ], { spacingAfter: 100 }),

                    // Section: Terms & Title Transfer (ماده ۴ - شرایط و توضیحات انتقال سند)
                    createParagraph([
                        createTextRun('ماده ۴- شرایط انتقال سند و تعویض پلاک:', { bold: true, size: 22, color: '1E3A8A' })
                    ], { spacingBefore: 120, spacingAfter: 40 }),
                    createParagraph([
                        createTextRun('کلیه مخارج انتقال سند و عوارض شهرداری و مالیات نقل و انتقال به عهده متصالح می‌باشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. سند خودرو فوق پس از به نام خوردن به نام مصالح، در دفترخانه اسناد رسمی به صورت وکالت تعویض پلاک به نام متصالح انتقال می‌یابد. متصالح نیز متعهد می‌گردد به محض دریافت وکالت و سند، نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک مصالح را فک نماید؛ در غیر این صورت روزانه مبلغ ۵۰۰ هزار تومان خسارت باید به مصالح پرداخت نماید. این معامله در تاریخ ', { size: 20 }),
                        createTextRun(toPersianDigits(contractDate) || '....................', { bold: true, size: 20 }),
                        createTextRun(' و ساعت ', { size: 20 }),
                        createTextRun(toPersianDigits(contract.transactionTime) || '....:....', { bold: true, size: 20 }),
                        createTextRun(' بصورت قطعی انجام شد و حق فسخ وجود ندارد. ارتکاب هرگونه خلافی از تاریخ تحویل خودرو به عهده متصالح می‌باشد.', { size: 20 })
                    ], { spacingAfter: 100 }),

                    // Section: Clauses (ماده ۵ - شروط و توضیحات تکمیلی)
                    createParagraph([
                        createTextRun('ماده ۵- شروط و تعهدات تکمیلی قرارداد:', { bold: true, size: 22, color: '1E3A8A' })
                    ], { spacingBefore: 120, spacingAfter: 40 }),

                    createParagraph([
                        createTextRun('۱- ', { bold: true, size: 20 }),
                        createTextRun('کلیه هزینه‌های قراردادی، مالیات‌ها، عوارض، بیمه شخص ثالث، مالیات ارزش افزوده و سایر هزینه‌هایی که قانون یا قرارداد پرداخت آن را به عهده متصالح و مصرف‌کننده گذاشته است، به عهده متصالح می‌باشد. بدیهی است نرخ‌های موارد فوق بر اساس قوانین و توافقات فعلی محاسبه شده است.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۲- ', { bold: true, size: 20 }),
                        createTextRun('متصالح در کمال صحت عقل و اختیار و به موجب مفاد این صلح‌نامه، کافه خیارات خصوصاً خیار غبن ولو فاحش به اعلی مرتبه و نیز هرگونه ادعایی نسبت به خودروی موضوع صلح را از جمله گرانفروشی و غیره و حق هرگونه دعوی و یا شکایت و اعتراض در هر یک از مراجع اداری، انتظامی و قضایی از خود سلب و ساقط نمود.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۳- ', { bold: true, size: 20 }),
                        createTextRun('مرجع رسیدگی به هرگونه شکایت یا دعوی در خصوص این قرارداد شهرستان شیراز می‌باشد.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۴- ', { bold: true, size: 20 }),
                        createTextRun('در صورت بروز هرگونه اختلاف در تفسیر و یا تعبیر یا اجرای این قرارداد(صلحنامه) اعم از اجرای تعهدات، انحلال قرارداد (اقاله، فسخ، انفساخ، بطلان و ابطال و اتمام مدت)، آثار و تبعات و الزامات بعد از انحلال قرارداد، خسارات، تفسیر و غیره بدواً از طریق مذاکره حداکثر ظرف مدت ۱۵ روز حل و فصل خواهد شد و در صورت عدم حصول نتیجه موضوع از طریق داور مرضی‌الطرفین آقای محمد شکرشکن به شماره ملی ۲۲۹۸۹۲۰۰۸۷ با شناسه داوری ۹۸۱۸۸ و عضو کانون داوران استان فارس رسیدگی و حل و فصل می‌گردد. مدت داوری سه ماه و با تشخیص داور مدت سه ماه دیگر نیز قابل افزایش است و رای داور برای طرفین و قائم‌مقام قانونی آنان لازم‌الاتباع است و شرط داوری مستقل از اعتبار و صحت و بقای قرارداد (صلحنامه) است.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۵- ', { bold: true, size: 20 }),
                        createTextRun('اطلاعات حساب بانکی متصالح: شماره حساب ', { size: 20 }),
                        createTextRun(toPersianDigits(contract.releaseeAccountNumber) || '....................', { bold: true, size: 20 }),
                        createTextRun(' شماره شبا ', { size: 20 }),
                        createTextRun(contract.releaseeShebaNumber ? ('IR' + contract.releaseeShebaNumber.replace(/^IR/i, '')) : '........................', { bold: true, size: 20 }),
                        createTextRun(' نزد بانک ', { size: 20 }),
                        createTextRun(contract.releaseeBankName || '..........', { bold: true, size: 20 }),
                        createTextRun(' می‌باشد که پرداخت کلیه ثمن معامله صرفاً از طریق حساب مذکور انجام خواهد شد.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۶- ', { bold: true, size: 20 }),
                        createTextRun('تمامی مکاتبات و تماس و پیامک‌ها به آدرس و شماره همراه مذکور ابلاغ و اعلام می‌گردد. بدیهی است در صورت هرگونه تغییر در آدرس یا شماره تلفن همراه و اطلاعات حساب بانکی فوق‌الذکر متصالح موظف است ظرف مدت ۳ روز مراتب را کتباً به مصالح اعلام نماید. در غیر اینصورت مسئولیت آن متوجه متصالح می‌باشد.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۷- ', { bold: true, size: 20 }),
                        createTextRun('تنظیم صورتجلسه تحویل خودرو به منزله تایید صحت و سلامت خودروی تحویل گرفته شده از سوی مصالح می‌باشد. با این وجود مسئولیت رفع هرگونه ایراد و یا نقص فنی خودرو و جبران خسارات به عهده مراجع و نمایندگی‌های مجاز خدمات پس از فروش شرکت کرمان موتور است و از این حیث هیچ مسئولیتی متوجه مصالح نیست.', { size: 20 })
                    ], { spacingAfter: 60 }),

                    createParagraph([
                        createTextRun('۸- ', { bold: true, size: 20 }),
                        createTextRun('این صلح‌نامه در تاریخ ', { size: 20 }),
                        createTextRun(toPersianDigits(contractDate) || '....................', { bold: true, size: 20 }),
                        createTextRun(' طبق ماده ۱۰ قانون مدنی در دو نسخه با متن و حکم و اعتبار واحد فی‌مابین طرفین امضا و مبادله شد و مفاد آن برای طرفین لازم‌الاتباع است.', { size: 20 })
                    ], { spacingAfter: 120 }),

                    // Confession statement
                    createParagraph([
                        createTextRun('اینجانب ', { bold: true, size: 21 }),
                        createTextRun(`${contract.releaseeTitle || 'آقای/خانم'} ${contract.releaseeName || '....................'}`, { bold: true, size: 21, color: '1E3A8A' }),
                        createTextRun(' با مطالعه دقیق قرارداد فوق و علم و آگاهی کامل از مفاد آن با رضایت آن را امضاء نمودم.', { bold: true, size: 21 })
                    ], { spacingBefore: 100, spacingAfter: 180 }),

                    // Signatures Table
                    signaturesTable
                ]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const sanitizedNumber = contractNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `قرارداد_صلح_خودرو_${sanitizedNumber}.docx`);
}

// =========================================================================
// 2. BANK LETTER / SATNA (نامه بانک)
// =========================================================================

export async function exportBankLetterToWord(letter: BankLetter): Promise<void> {
    const letterNo = letter.letterNumber || '1405/KM2606/---';
    const letterDate = letter.letterDate || '1405/06/22';
    const formattedAmount = formatCurrencyWithCommas(letter.amountRials);
    const amountInWords = letter.amountWords || (numberToPersianWords(letter.amountRials) + ' ریال');
    const branchText = letter.destinationBranchName ? ` ${letter.destinationBranchName}` : '';
    const colorText = letter.carColor ? ` به رنگ ${letter.carColor}` : '';
    const yearText = letter.carModelYear ? ` مدل ${letter.carModelYear}` : '';

    // Official Bank Letter Header Table (سربرگ رسمی)
    const headerTable = new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 14, color: '1E3A8A' }
        },
        rows: [
            new TableRow({
                children: [
                    // Right: Company Title
                    new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('شرکت حسینی خودرو شیراز', { bold: true, size: 24, color: '1E3A8A' })
                            ], { spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('نمایندگی رسمی ۲۶۰۶ کرمان موتور', { bold: true, size: 19, color: '475569' })
                            ], { spacingAfter: 40 })
                        ]
                    }),
                    // Center: "بنام خدا"
                    new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('بنام خدا', { bold: true, size: 24, color: '0F172A' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 40 })
                        ]
                    }),
                    // Left: Letter Number & Date
                    new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('شماره: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun(letterNo, { bold: true, size: 19, color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('تاریخ: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun(toPersianDigits(letterDate), { bold: true, size: 19, color: '0F172A' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('پیوست: ', { bold: true, size: 18, color: '64748B' }),
                                createTextRun('ندارد', { size: 18, color: '475569' })
                            ], { alignment: AlignmentType.LEFT, spacingAfter: 40 })
                        ]
                    })
                ]
            })
        ]
    });

    // Official Footer (پانوشت)
    const footerParagraph = createParagraph([
        createTextRun('شیراز - نمایندگی ۲۶۰۶ کرمان موتور (حسینی خودرو) | تلفن تماس: ۰۷۱-۳۷۲۶۰۰۰۰ | سامانه فروش اتولید  —  صفحه ', { size: 16, color: '64748B' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT_ARIAL, size: 16 }),
        createTextRun(' از ', { size: 16, color: '64748B' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_ARIAL, size: 16 })
    ], { alignment: AlignmentType.CENTER });

    // Signature Block Table
    const signatureTable = new Table({
        visuallyRightToLeft: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                children: [
                    // Right: Security metadata
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('اصالت‌سنجی نامه اداری:', { bold: true, size: 18, color: '475569' })
                            ], { spacingAfter: 20 }),
                            createParagraph([
                                createTextRun(`کد یکتای پیگیری: ${letterNo}`, { size: 17, color: '64748B' })
                            ], { spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('سامانه جامع نمایندگی ۲۶۰۶ کرمان موتور', { size: 17, color: '64748B' })
                            ])
                        ]
                    }),
                    // Left: Signatory & Seal
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            createParagraph([
                                createTextRun('با تشکر و احترام', { bold: true, size: 21, color: '334155' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 40 }),
                            createParagraph([
                                createTextRun(letter.dealershipName || 'نمایندگی ۲۶۰۶ کرمان موتور', { bold: true, size: 22, color: '1E3A8A' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 20 }),
                            createParagraph([
                                createTextRun('(شرکت حسینی خودرو شیراز)', { bold: false, size: 18, color: '64748B' })
                            ], { alignment: AlignmentType.CENTER, spacingAfter: 600 }),
                            createParagraph([
                                createTextRun('[محل امضا و مهر نمایندگی]', { italics: true, size: 18, color: '94A3B8' })
                            ], { alignment: AlignmentType.CENTER })
                        ]
                    })
                ]
            })
        ]
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: FONT_ARIAL, size: 22, color: '1E293B', rightToLeft: true }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1400, bottom: 1400, right: 1400, left: 1400 }
                    }
                },
                headers: {
                    default: new Header({ children: [headerTable] })
                },
                footers: {
                    default: new Footer({ children: [footerParagraph] })
                },
                children: [
                    // Spacing
                    createParagraph([], { spacingAfter: 180 }),

                    // Addressee
                    createParagraph([
                        createTextRun(`ریاست محترم ${letter.destinationBankName || 'بانک ...'}${branchText}`, { bold: true, size: 25, color: '0F172A' })
                    ], { spacingBefore: 120, spacingAfter: 40 }),
                    createParagraph([
                        createTextRun('با سلام و احترام،', { bold: true, size: 22, color: '334155' })
                    ], { spacingAfter: 160 }),

                    // Letter Body
                    createParagraph([
                        createTextRun('احتراماً ', { size: 22 }),
                        createTextRun(letter.customerTitle || 'خانم/آقای', { bold: true, size: 22 }),
                        createTextRun(' ', { size: 22 }),
                        createTextRun(letter.customerName || '....................', { bold: true, size: 22, color: '1E3A8A' }),
                        createTextRun(' به کدملی ', { size: 22 }),
                        createTextRun(toPersianDigits(letter.customerNationalCode) || '..........', { bold: true, size: 22 }),
                        createTextRun(' جهت امور بانکی و واریز وجه به مبلغ ', { size: 22 }),
                        createTextRun(`${toPersianDigits(formattedAmount || '0')} ریال`, { bold: true, size: 22, color: '1E3A8A' }),
                        createTextRun(` (${amountInWords}) `, { size: 21, color: '475569' }),
                        createTextRun(letter.paymentMethod || 'بصورت حواله ساتنا', { bold: true, size: 22 }),
                        createTextRun(' به شماره شبا ', { size: 22 }),
                        createTextRun(letter.shebaNumber || '........................', { bold: true, size: 22, color: '065F46' }),
                        createTextRun(' نزد ', { size: 22 }),
                        createTextRun(letter.beneficiaryBankName || 'بانک ...', { bold: true, size: 22 }),
                        createTextRun(' بنام ', { size: 22 }),
                        createTextRun(letter.accountHolderName || 'شرکت حسینی خودرو شیراز', { bold: true, size: 22, color: '1E3A8A' }),
                        createTextRun(' جهت خرید یک دستگاه ', { size: 22 }),
                        createTextRun(letter.carModel || '...', { bold: true, size: 22 }),
                        createTextRun(yearText, { bold: true, size: 22 }),
                        createTextRun(colorText, { bold: true, size: 22 }),
                        createTextRun(' به خدمت حضورتان معرفی می‌گردند.', { size: 22 })
                    ], { lineSpacing: 420, spacingAfter: 180 }),

                    // Respectful closing sentence
                    createParagraph([
                        createTextRun('خواهشمند است بذل لطف نموده همکاری‌های لازم با نامبرده را مبذول فرمایید.', { size: 22, color: '1E293B' })
                    ], { lineSpacing: 380, spacingAfter: 360 }),

                    // Signatures block
                    signatureTable
                ]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const sanitizedNumber = letterNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `نامه_بانک_${sanitizedNumber}.docx`);
}
