import type {
    BankLetter,
    CarPeaceContract,
    DocumentCaseFormId,
    DocumentDossier,
    DocumentPaperSize,
    FreeBillOfSale,
    PreContractForm,
    RemittanceApprovalForm,
    SavedBankAccount
} from '../types/bankLetter';
import {
    formatOfficialLetterText,
    generateLetterNumber,
    getCurrentPersianDate
} from './bankLetterService';
import {
    formatPeaceContractText,
    generatePeaceContractNumber
} from './peaceContractService';
import {
    formatFreeBillText,
    formatPreContractText,
    formatRemittanceApprovalText,
    generateFreeBillNumber,
    generatePreContractNumber,
    generateRemittanceNumber
} from './additionalFormsService';
import { numberToPersianWords } from './bankLetterValidation';
import type { OfficialDocPayload } from './officialHtmlPrintBuilder';
import {
    exportBankLetterToWord,
    exportFreeBillToWord,
    exportPeaceContractToWord,
    exportPreContractToWord,
    exportRemittanceApprovalToWord
} from './wordExportService';

const DOSSIER_STORAGE_KEY = 'autolead_document_dossiers_v1';

export interface DocumentFormMeta {
    id: DocumentCaseFormId;
    title: string;
    shortTitle: string;
    badge: string;
    description: string;
    accentClass: string;
}

export const DOCUMENT_FORMS_LIST: DocumentFormMeta[] = [
    {
        id: 'PEACE_CONTRACT',
        title: 'قرارداد صلح خودرو',
        shortTitle: 'قرارداد صلح',
        badge: 'ماده ۱۰ و شرط داوری',
        description: 'صلح‌نامه رسمی خودرو بین شرکت تضامنی حسینی خودرو شیراز (مصالح) و خریدار (متصالح)',
        accentClass: 'from-amber-600 to-orange-600'
    },
    {
        id: 'BANK_LETTER',
        title: 'نامه معرفی به بانک',
        shortTitle: 'نامه بانک',
        badge: 'حواله ساتنا / پایا',
        description: 'معرفی‌نامه رسمی مشتری به بانک جهت واریز وجه به حساب شرکتی یا شخصی',
        accentClass: 'from-blue-600 to-indigo-700'
    },
    {
        id: 'PRE_CONTRACT',
        title: 'فرم پیش قرارداد',
        shortTitle: 'فرم پیش قرارداد',
        badge: 'نمایندگی ۲۶۰۶ حسینی',
        description: 'درخواست پیش‌پرداخت، زمان تسویه الباقی و شرایط انصراف روزانه یک درصد',
        accentClass: 'from-violet-600 to-purple-700'
    },
    {
        id: 'REMITTANCE_APPROVAL',
        title: 'فرم تایید نهایی حواله',
        shortTitle: 'تایید نهایی حواله',
        badge: 'حسابداری، فروش، مدیریت',
        description: 'کنترل وضعیت مالی، تاییدیه فروش و امضای مدیریت جهت صدور نهایی حواله خودرو',
        accentClass: 'from-emerald-600 to-teal-700'
    },
    {
        id: 'FREE_BILL_OF_SALE',
        title: 'قولنامه آزاد',
        shortTitle: 'قولنامه آزاد',
        badge: 'مبایعه‌نامه قطعی',
        description: 'مبایعه‌نامه رسمی خرید و فروش آزاد خودرو شامل مشخصات فروشنده، خریدار و مدارک تحویلی',
        accentClass: 'from-teal-600 to-cyan-700'
    }
];

export function generateDossierNumber(): string {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `1405/DOC-${rand}`;
}

export function createDefaultDocumentDossier(defaultAccount?: SavedBankAccount): DocumentDossier {
    const nowDate = getCurrentPersianDate();
    return {
        id: `doc-${Date.now()}`,
        dossierNumber: generateDossierNumber(),
        dossierDate: nowDate,
        transactionTime: '11:00',

        peaceContractNumber: generatePeaceContractNumber(),
        bankLetterNumber: generateLetterNumber(),
        preContractNumber: generatePreContractNumber(),
        remittanceFormNumber: generateRemittanceNumber(),
        freeBillNumber: generateFreeBillNumber(),

        customerTitle: 'آقای',
        customerName: '',
        customerFatherName: '',
        customerIdNumber: '',
        customerIssuePlace: '',
        customerNationalCode: '',
        customerAddress: '',
        customerPostalCode: '',
        customerPhone: '',

        customerAccountNumber: '',
        customerShebaNumber: '',
        customerBankName: '',

        carModel: 'KMC eagle',
        modelYear: '1405',
        color: 'سفید',
        chassisNumber: '',
        plateNumber: '',
        deliveryTime: '',
        deliveredDocuments: 'کارت خودرو، برگ سبز، بیمه‌نامه، کارت گارانتی و کلید یدک',

        totalAmountRials: 0,
        paidAmountRials: 0,
        trackingNumber: '',
        remainingPaymentDate: '',
        totalAmountDescription: '',

        letterType: defaultAccount?.accountType === 'INDIVIDUAL' ? 'PERSONAL' : 'CORPORATE',
        destinationBankName: 'بانک رفاه کارگران',
        destinationBranchName: 'شعبه مرکزی شیراز',
        bankLetterAmountRials: 0,
        paymentMethod: 'بصورت حواله ساتنا',
        beneficiaryShebaNumber: defaultAccount?.shebaNumber || '590130100000000358157511',
        beneficiaryBankName: defaultAccount?.bankName || 'بانک رفاه کارگران',
        beneficiaryAccountHolderName: defaultAccount?.accountHolderName || 'شرکت حسینی خودرو شیراز',
        beneficiaryAccountHolderType: defaultAccount?.accountType || 'COMPANY',
        dealershipName: 'نمایندگی کرمان موتور 2606',
        signatoryTitle: 'مدیریت نمایندگی ۲۶۰۶ کرمان موتور (شرکت حسینی خودرو شیراز)',

        releasorName: 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی',
        releasorNationalId: '14012274787',
        releasorAddress: 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال',
        releasorPostalCode: '7173714734',
        releasorPhone: '07191690906',

        sellerTitle: 'خانم',
        sellerName: 'شرکت تضامنی حسینی خودرو شیراز (به نمایندگی خانم حسینی)',
        sellerFatherName: '',
        sellerIdNumber: '14012274787',
        sellerIssuePlace: 'شیراز',
        sellerNationalCode: '14012274787',
        sellerAddress: 'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال',
        sellerPostalCode: '7173714734',
        sellerPhone: '07191690906',

        accCheckNoDebt: false,
        accCheckMatched: false,
        accCheckClear: false,
        accountingManagerName: '',
        accountingDate: nowDate,
        salesCheckCorrect: false,
        salesCheckInvoice: false,
        salesManagerName: '',
        salesDate: nowDate,
        salesNotes: '',
        mgmtCheckSignatures: false,
        salesResponsibilityWith: '',

        notes: '',
        status: 'DRAFT',
        createdAt: new Date().toISOString()
    };
}

export function normalizeDocumentDossier(raw: any): DocumentDossier {
    const base = createDefaultDocumentDossier();
    if (!raw || typeof raw !== 'object') return base;
    return {
        ...base,
        ...raw,
        totalAmountRials: Number(raw.totalAmountRials || 0),
        paidAmountRials: Number(raw.paidAmountRials || 0),
        bankLetterAmountRials: Number(raw.bankLetterAmountRials || 0)
    };
}

export function getSavedDocumentDossiers(): DocumentDossier[] {
    try {
        const stored = localStorage.getItem(DOSSIER_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map(normalizeDocumentDossier);
            }
        }
    } catch (e) {
        console.warn('Error reading document dossiers from localStorage:', e);
    }
    return [];
}

export function saveOrUpdateDocumentDossier(dossier: DocumentDossier): DocumentDossier[] {
    const current = getSavedDocumentDossiers();
    const nowIso = new Date().toISOString();
    const toSave: DocumentDossier = {
        ...dossier,
        id: dossier.id || `doc-${Date.now()}`,
        dossierNumber: dossier.dossierNumber || generateDossierNumber(),
        updatedAt: nowIso,
        createdAt: dossier.createdAt || nowIso
    };

    const idx = current.findIndex((item) => item.id === toSave.id);
    const updated =
        idx >= 0
            ? current.map((item, i) => (i === idx ? toSave : item))
            : [toSave, ...current];

    try {
        localStorage.setItem(DOSSIER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error saving document dossiers to localStorage:', e);
    }
    return updated;
}

export function deleteDocumentDossier(id: string): DocumentDossier[] {
    const updated = getSavedDocumentDossiers().filter((d) => d.id !== id);
    try {
        localStorage.setItem(DOSSIER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error deleting document dossier:', e);
    }
    return updated;
}

// =========================================================================
// Projections: Convert Single Unified Dossier -> Each of the 5 Official Docs
// =========================================================================

export function dossierToPeaceContract(d: DocumentDossier): CarPeaceContract {
    return {
        id: `${d.id}-pc`,
        contractNumber: d.peaceContractNumber || d.dossierNumber,
        contractDate: d.dossierDate,
        transactionTime: d.transactionTime,
        releasorName: d.releasorName,
        releasorNationalId: d.releasorNationalId,
        releasorAddress: d.releasorAddress,
        releasorPostalCode: d.releasorPostalCode,
        releasorPhone: d.releasorPhone || '07191690906',
        releaseeTitle: d.customerTitle,
        releaseeName: d.customerName,
        releaseeFatherName: d.customerFatherName,
        releaseeIdNumber: d.customerIdNumber,
        releaseeIssuePlace: d.customerIssuePlace,
        releaseeNationalCode: d.customerNationalCode,
        releaseeAddress: d.customerAddress,
        releaseePostalCode: d.customerPostalCode,
        releaseePhone: d.customerPhone,
        carModel: d.carModel,
        chassisNumber: d.chassisNumber,
        plateNumber: d.plateNumber,
        modelYear: d.modelYear,
        color: d.color,
        totalAmountRials: d.totalAmountRials,
        paidAmountRials: d.paidAmountRials,
        trackingNumber: d.trackingNumber,
        releaseeAccountNumber: d.customerAccountNumber,
        releaseeShebaNumber: d.customerShebaNumber,
        releaseeBankName: d.customerBankName,
        notes: d.notes,
        status: d.status === 'COMPLETED' ? 'SIGNED' : 'DRAFT',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
}

export function dossierToBankLetter(d: DocumentDossier): BankLetter {
    const effectiveAmount =
        d.bankLetterAmountRials > 0
            ? d.bankLetterAmountRials
            : d.paidAmountRials > 0
            ? d.paidAmountRials
            : d.totalAmountRials;

    return {
        id: `${d.id}-bl`,
        letterNumber: d.bankLetterNumber || d.dossierNumber,
        letterDate: d.dossierDate,
        letterType: d.letterType,
        destinationBankName: d.destinationBankName,
        destinationBranchName: d.destinationBranchName,
        customerTitle: d.customerTitle,
        customerName: d.customerName,
        customerNationalCode: d.customerNationalCode,
        amountRials: effectiveAmount,
        amountWords: effectiveAmount > 0 ? `${numberToPersianWords(effectiveAmount)} ریال` : '',
        paymentMethod: d.paymentMethod,
        shebaNumber: d.beneficiaryShebaNumber,
        beneficiaryBankName: d.beneficiaryBankName,
        accountHolderName: d.beneficiaryAccountHolderName,
        accountHolderType: d.beneficiaryAccountHolderType,
        carModel: d.carModel,
        carModelYear: d.modelYear,
        carColor: d.color,
        dealershipName: d.dealershipName,
        signatoryTitle: d.signatoryTitle,
        notes: d.notes,
        status: d.status === 'COMPLETED' ? 'ISSUED' : 'DRAFT',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
}

export function dossierToPreContract(d: DocumentDossier): PreContractForm {
    return {
        id: `${d.id}-pre`,
        contractNumber: d.preContractNumber || d.dossierNumber,
        contractDate: d.dossierDate,
        buyerTitle: d.customerTitle,
        buyerName: d.customerName,
        buyerFatherName: d.customerFatherName,
        buyerNationalCode: d.customerNationalCode,
        carModel: d.carModel,
        modelYear: d.modelYear,
        color: d.color,
        totalPriceRials: d.totalAmountRials,
        prepaymentRials: d.paidAmountRials,
        remainingPaymentDate: d.remainingPaymentDate,
        status: d.status === 'COMPLETED' ? 'SIGNED' : 'DRAFT',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
}

export function dossierToRemittanceApproval(d: DocumentDossier): RemittanceApprovalForm {
    const remaining = Math.max(0, (d.totalAmountRials || 0) - (d.paidAmountRials || 0));
    return {
        id: `${d.id}-rem`,
        formNumber: d.remittanceFormNumber || d.dossierNumber,
        formDate: d.dossierDate,
        carModel: d.carModel,
        color: d.color,
        deliveryTime: d.deliveryTime,
        customerName: d.customerName,
        customerNationalCode: d.customerNationalCode,
        customerPhone: d.customerPhone,
        accCheckNoDebt: d.accCheckNoDebt,
        accCheckMatched: d.accCheckMatched,
        accCheckClear: d.accCheckClear,
        totalAmountRials: d.totalAmountRials,
        paidAmountRials: d.paidAmountRials,
        remainingAmountRials: remaining,
        accountingManagerName: d.accountingManagerName,
        accountingDate: d.accountingDate || d.dossierDate,
        salesCheckCorrect: d.salesCheckCorrect,
        salesCheckInvoice: d.salesCheckInvoice,
        salesManagerName: d.salesManagerName,
        salesDate: d.salesDate || d.dossierDate,
        salesNotes: d.salesNotes || d.notes,
        mgmtCheckSignatures: d.mgmtCheckSignatures,
        salesResponsibilityWith: d.salesResponsibilityWith,
        status: d.status === 'COMPLETED' ? 'APPROVED' : 'DRAFT',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
}

export function dossierToFreeBill(d: DocumentDossier): FreeBillOfSale {
    return {
        id: `${d.id}-fb`,
        contractNumber: d.freeBillNumber || d.dossierNumber,
        contractDate: d.dossierDate,
        transactionTime: d.transactionTime,
        sellerTitle: d.sellerTitle,
        sellerName: d.sellerName,
        sellerFatherName: d.sellerFatherName,
        sellerIdNumber: d.sellerIdNumber,
        sellerIssuePlace: d.sellerIssuePlace,
        sellerNationalCode: d.sellerNationalCode,
        sellerAddress: d.sellerAddress,
        sellerPostalCode: d.sellerPostalCode,
        sellerPhone: d.sellerPhone,
        buyerTitle: d.customerTitle,
        buyerName: d.customerName,
        buyerFatherName: d.customerFatherName,
        buyerIdNumber: d.customerIdNumber,
        buyerIssuePlace: d.customerIssuePlace,
        buyerNationalCode: d.customerNationalCode,
        buyerAddress: d.customerAddress,
        buyerPostalCode: d.customerPostalCode,
        buyerPhone: d.customerPhone,
        carModel: d.carModel,
        chassisNumber: d.chassisNumber,
        color: d.color,
        plateNumber: d.plateNumber,
        totalAmountRials: d.totalAmountRials,
        totalAmountDescription: d.totalAmountDescription,
        deliveredDocuments: d.deliveredDocuments,
        status: d.status === 'COMPLETED' ? 'SIGNED' : 'DRAFT',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
}

export function dossierToOfficialPayload(
    d: DocumentDossier,
    formId: DocumentCaseFormId
): OfficialDocPayload {
    switch (formId) {
        case 'PEACE_CONTRACT':
            return { type: 'PEACE_CONTRACT', data: dossierToPeaceContract(d) };
        case 'BANK_LETTER':
            return { type: 'BANK_LETTER', data: dossierToBankLetter(d) };
        case 'PRE_CONTRACT':
            return { type: 'PRE_CONTRACT', data: dossierToPreContract(d) };
        case 'REMITTANCE_APPROVAL':
            return { type: 'REMITTANCE_APPROVAL', data: dossierToRemittanceApproval(d) };
        case 'FREE_BILL_OF_SALE':
            return { type: 'FREE_BILL_OF_SALE', data: dossierToFreeBill(d) };
    }
}

export function formatDossierFormText(d: DocumentDossier, formId: DocumentCaseFormId): string {
    switch (formId) {
        case 'PEACE_CONTRACT':
            return formatPeaceContractText(dossierToPeaceContract(d));
        case 'BANK_LETTER':
            return formatOfficialLetterText(dossierToBankLetter(d));
        case 'PRE_CONTRACT':
            return formatPreContractText(dossierToPreContract(d));
        case 'REMITTANCE_APPROVAL':
            return formatRemittanceApprovalText(dossierToRemittanceApproval(d));
        case 'FREE_BILL_OF_SALE':
            return formatFreeBillText(dossierToFreeBill(d));
    }
}

export async function exportDossierFormToWord(
    d: DocumentDossier,
    formId: DocumentCaseFormId,
    paperSize: DocumentPaperSize
): Promise<void> {
    switch (formId) {
        case 'PEACE_CONTRACT':
            return exportPeaceContractToWord(dossierToPeaceContract(d), paperSize);
        case 'BANK_LETTER':
            return exportBankLetterToWord(dossierToBankLetter(d), paperSize);
        case 'PRE_CONTRACT':
            return exportPreContractToWord(dossierToPreContract(d), paperSize);
        case 'REMITTANCE_APPROVAL':
            return exportRemittanceApprovalToWord(dossierToRemittanceApproval(d), paperSize);
        case 'FREE_BILL_OF_SALE':
            return exportFreeBillToWord(dossierToFreeBill(d), paperSize);
    }
}

// =========================================================================
// Legacy Importers (convert any legacy individual document -> Unified Dossier)
// =========================================================================

export function importLegacyPeaceContractToDossier(
    c: CarPeaceContract,
    defaultAccount?: SavedBankAccount
): DocumentDossier {
    const base = createDefaultDocumentDossier(defaultAccount);
    return {
        ...base,
        dossierDate: c.contractDate || base.dossierDate,
        transactionTime: c.transactionTime || base.transactionTime,
        peaceContractNumber: c.contractNumber || base.peaceContractNumber,
        releasorName: c.releasorName || base.releasorName,
        releasorNationalId: c.releasorNationalId || base.releasorNationalId,
        releasorAddress: c.releasorAddress || base.releasorAddress,
        releasorPostalCode: c.releasorPostalCode || base.releasorPostalCode,
        releasorPhone: c.releasorPhone || base.releasorPhone,
        customerTitle: c.releaseeTitle || base.customerTitle,
        customerName: c.releaseeName,
        customerFatherName: c.releaseeFatherName,
        customerIdNumber: c.releaseeIdNumber,
        customerIssuePlace: c.releaseeIssuePlace,
        customerNationalCode: c.releaseeNationalCode,
        customerAddress: c.releaseeAddress,
        customerPostalCode: c.releaseePostalCode,
        customerPhone: c.releaseePhone,
        customerAccountNumber: c.releaseeAccountNumber,
        customerShebaNumber: c.releaseeShebaNumber,
        customerBankName: c.releaseeBankName,
        carModel: c.carModel || base.carModel,
        chassisNumber: c.chassisNumber,
        plateNumber: c.plateNumber,
        modelYear: c.modelYear || base.modelYear,
        color: c.color || base.color,
        totalAmountRials: c.totalAmountRials,
        paidAmountRials: c.paidAmountRials,
        trackingNumber: c.trackingNumber,
        notes: c.notes || ''
    };
}

export function importLegacyBankLetterToDossier(
    l: BankLetter,
    defaultAccount?: SavedBankAccount
): DocumentDossier {
    const base = createDefaultDocumentDossier(defaultAccount);
    return {
        ...base,
        dossierDate: l.letterDate || base.dossierDate,
        bankLetterNumber: l.letterNumber || base.bankLetterNumber,
        letterType: l.letterType,
        destinationBankName: l.destinationBankName,
        destinationBranchName: l.destinationBranchName || '',
        customerTitle: l.customerTitle || base.customerTitle,
        customerName: l.customerName,
        customerNationalCode: l.customerNationalCode,
        totalAmountRials: l.amountRials,
        paidAmountRials: l.amountRials,
        bankLetterAmountRials: l.amountRials,
        paymentMethod: l.paymentMethod,
        beneficiaryShebaNumber: l.shebaNumber,
        beneficiaryBankName: l.beneficiaryBankName,
        beneficiaryAccountHolderName: l.accountHolderName,
        beneficiaryAccountHolderType: l.accountHolderType,
        carModel: l.carModel || base.carModel,
        modelYear: l.carModelYear || base.modelYear,
        color: l.carColor || base.color,
        dealershipName: l.dealershipName || base.dealershipName,
        signatoryTitle: l.signatoryTitle || base.signatoryTitle,
        notes: l.notes || ''
    };
}

export function importLegacyPreContractToDossier(
    f: PreContractForm,
    defaultAccount?: SavedBankAccount
): DocumentDossier {
    const base = createDefaultDocumentDossier(defaultAccount);
    return {
        ...base,
        dossierDate: f.contractDate || base.dossierDate,
        preContractNumber: f.contractNumber || base.preContractNumber,
        customerTitle: f.buyerTitle || base.customerTitle,
        customerName: f.buyerName,
        customerFatherName: f.buyerFatherName,
        customerNationalCode: f.buyerNationalCode,
        carModel: f.carModel || base.carModel,
        modelYear: f.modelYear || base.modelYear,
        color: f.color || base.color,
        totalAmountRials: f.totalPriceRials,
        paidAmountRials: f.prepaymentRials,
        remainingPaymentDate: f.remainingPaymentDate
    };
}

export function importLegacyRemittanceToDossier(
    f: RemittanceApprovalForm,
    defaultAccount?: SavedBankAccount
): DocumentDossier {
    const base = createDefaultDocumentDossier(defaultAccount);
    return {
        ...base,
        dossierDate: f.formDate || base.dossierDate,
        remittanceFormNumber: f.formNumber || base.remittanceFormNumber,
        carModel: f.carModel || base.carModel,
        color: f.color || base.color,
        deliveryTime: f.deliveryTime,
        customerName: f.customerName,
        customerNationalCode: f.customerNationalCode,
        customerPhone: f.customerPhone,
        accCheckNoDebt: f.accCheckNoDebt,
        accCheckMatched: f.accCheckMatched,
        accCheckClear: f.accCheckClear,
        totalAmountRials: f.totalAmountRials,
        paidAmountRials: f.paidAmountRials,
        accountingManagerName: f.accountingManagerName,
        accountingDate: f.accountingDate,
        salesCheckCorrect: f.salesCheckCorrect,
        salesCheckInvoice: f.salesCheckInvoice,
        salesManagerName: f.salesManagerName,
        salesDate: f.salesDate,
        salesNotes: f.salesNotes,
        mgmtCheckSignatures: f.mgmtCheckSignatures,
        salesResponsibilityWith: f.salesResponsibilityWith
    };
}

export function importLegacyFreeBillToDossier(
    f: FreeBillOfSale,
    defaultAccount?: SavedBankAccount
): DocumentDossier {
    const base = createDefaultDocumentDossier(defaultAccount);
    return {
        ...base,
        dossierDate: f.contractDate || base.dossierDate,
        transactionTime: f.transactionTime || base.transactionTime,
        freeBillNumber: f.contractNumber || base.freeBillNumber,
        sellerTitle: f.sellerTitle,
        sellerName: f.sellerName,
        sellerFatherName: f.sellerFatherName,
        sellerIdNumber: f.sellerIdNumber,
        sellerIssuePlace: f.sellerIssuePlace,
        sellerNationalCode: f.sellerNationalCode,
        sellerAddress: f.sellerAddress,
        sellerPostalCode: f.sellerPostalCode,
        sellerPhone: f.sellerPhone,
        customerTitle: f.buyerTitle,
        customerName: f.buyerName,
        customerFatherName: f.buyerFatherName,
        customerIdNumber: f.buyerIdNumber,
        customerIssuePlace: f.buyerIssuePlace,
        customerNationalCode: f.buyerNationalCode,
        customerAddress: f.buyerAddress,
        customerPostalCode: f.buyerPostalCode,
        customerPhone: f.buyerPhone,
        carModel: f.carModel || base.carModel,
        chassisNumber: f.chassisNumber,
        color: f.color || base.color,
        plateNumber: f.plateNumber,
        totalAmountRials: f.totalAmountRials,
        totalAmountDescription: f.totalAmountDescription,
        deliveredDocuments: f.deliveredDocuments
    };
}
