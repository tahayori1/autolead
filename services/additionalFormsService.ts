import type {
    PreContractForm,
    RemittanceApprovalForm,
    FreeBillOfSale
} from '../types/bankLetter';
import {
    formatCurrencyWithCommas,
    numberToPersianWords,
    toPersianDigits
} from './bankLetterValidation';

const PRE_CONTRACT_STORAGE_KEY = 'autolead_pre_contracts_v1';
const REMITTANCE_STORAGE_KEY = 'autolead_remittance_approvals_v1';
const FREE_BILL_STORAGE_KEY = 'autolead_free_bills_v1';

// =========================================================================
// 1. فرم پیش قرارداد (Pre-Contract Form)
// =========================================================================

export const DEFAULT_PRE_CONTRACT: PreContractForm = {
    id: '',
    contractNumber: '',
    contractDate: '',
    buyerTitle: 'آقای',
    buyerName: '',
    buyerFatherName: '',
    buyerNationalCode: '',
    carModel: 'KMC eagle',
    modelYear: '1405',
    color: 'سفید',
    totalPriceRials: 0,
    prepaymentRials: 0,
    remainingPaymentDate: '',
    status: 'DRAFT',
    createdAt: ''
};

export function generatePreContractNumber(): string {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `1405/PRE-${rand}`;
}

export function getSavedPreContracts(): PreContractForm[] {
    try {
        const stored = localStorage.getItem(PRE_CONTRACT_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('Error reading saved pre-contracts:', e);
    }
    return [];
}

export function saveOrUpdatePreContract(form: PreContractForm): PreContractForm[] {
    const current = getSavedPreContracts();
    const idx = current.findIndex(item => item.id === form.id);
    const nowIso = new Date().toISOString();
    const itemToSave: PreContractForm = {
        ...form,
        id: form.id || `pre-${Date.now()}`,
        contractNumber: form.contractNumber || generatePreContractNumber(),
        updatedAt: nowIso,
        createdAt: form.createdAt || nowIso
    };
    const updated = idx >= 0
        ? current.map((item, i) => (i === idx ? itemToSave : item))
        : [itemToSave, ...current];
    try {
        localStorage.setItem(PRE_CONTRACT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error saving pre-contracts:', e);
    }
    return updated;
}

export function deletePreContract(id: string): PreContractForm[] {
    const updated = getSavedPreContracts().filter(item => item.id !== id);
    try {
        localStorage.setItem(PRE_CONTRACT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error deleting pre-contract:', e);
    }
    return updated;
}

export function formatPreContractText(f: PreContractForm): string {
    const totalStr = f.totalPriceRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(f.totalPriceRials))} (${numberToPersianWords(f.totalPriceRials)})`
        : '...............................';
    const prepayStr = f.prepaymentRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(f.prepaymentRials))} (${numberToPersianWords(f.prepaymentRials)})`
        : '................................';

    return `بسمه تعالی
فرم پیش قرارداد
شماره: ${toPersianDigits(f.contractNumber || '-')} | تاریخ: ${toPersianDigits(f.contractDate || '-')}

مشخصات خریدار:
اینجانب ${f.buyerTitle || 'خانم / آقای'} ${f.buyerName || '.................................'} فرزند ${f.buyerFatherName || '............................'} به کدملی ${toPersianDigits(f.buyerNationalCode) || '.........................'} متقاضی خرید یک دستگاه خودرو ${f.carModel || '...............................'} مدل ${toPersianDigits(f.modelYear) || '..................'} رنگ ${f.color || '................'} در نمایندگی 2606 حسینی می باشم.
- ثمن مورد معامله به مبلغ ${totalStr} ریال مورد تایید اینجانب می باشد.
- متعهد می گردم همزمان با این درخواست، مبلغ ${prepayStr} ریال به عنوان پیش پرداخت به حساب کرمان موتور 2606 حسینی واریز نمایم.
- الباقی ثمن معامله مورخ ${toPersianDigits(f.remainingPaymentDate) || '..........................'} پرداخت میگردد. در صورت عدم پرداخت مابقی وجه در موعد مقرر معامله به صورت یکطرفه از سوی فروشنده فسخ خواهد شد.
- چنانچه قصد انصراف از خرید خودرو با مشخصات فوق را اعلام نمایم، شرکت حسینی خودرو شیراز مجاز خواهد بود روزانه مبلغ یک درصد از مبلغ پرداختی را به عنوان خسارت انصراف از خرید تا تاریخ اعلام اینجانب در وجه خود کارسازی نموده و الباقی را حداکثر ظرف مدت 30 روز به اینجانب اعاده نماید.

نام و امضای خریدار: ${f.buyerName || '....................'}                    اثر انگشت`;
}

// =========================================================================
// 2. فرم تایید نهایی حواله (Remittance Final Approval Form)
// =========================================================================

export const DEFAULT_REMITTANCE_APPROVAL: RemittanceApprovalForm = {
    id: '',
    formNumber: '',
    formDate: '',
    carModel: 'KMC eagle',
    color: 'سفید',
    deliveryTime: '',
    customerName: '',
    customerNationalCode: '',
    customerPhone: '',
    accCheckNoDebt: false,
    accCheckMatched: false,
    accCheckClear: false,
    totalAmountRials: 0,
    paidAmountRials: 0,
    remainingAmountRials: 0,
    accountingManagerName: '',
    accountingDate: '',
    salesCheckCorrect: false,
    salesCheckInvoice: false,
    salesManagerName: '',
    salesDate: '',
    salesNotes: '',
    mgmtCheckSignatures: false,
    salesResponsibilityWith: '',
    status: 'DRAFT',
    createdAt: ''
};

export function generateRemittanceNumber(): string {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `1405/REM-${rand}`;
}

export function getSavedRemittanceApprovals(): RemittanceApprovalForm[] {
    try {
        const stored = localStorage.getItem(REMITTANCE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('Error reading saved remittance approvals:', e);
    }
    return [];
}

export function saveOrUpdateRemittanceApproval(form: RemittanceApprovalForm): RemittanceApprovalForm[] {
    const current = getSavedRemittanceApprovals();
    const idx = current.findIndex(item => item.id === form.id);
    const nowIso = new Date().toISOString();
    const itemToSave: RemittanceApprovalForm = {
        ...form,
        id: form.id || `rem-${Date.now()}`,
        formNumber: form.formNumber || generateRemittanceNumber(),
        updatedAt: nowIso,
        createdAt: form.createdAt || nowIso
    };
    const updated = idx >= 0
        ? current.map((item, i) => (i === idx ? itemToSave : item))
        : [itemToSave, ...current];
    try {
        localStorage.setItem(REMITTANCE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error saving remittance approvals:', e);
    }
    return updated;
}

export function deleteRemittanceApproval(id: string): RemittanceApprovalForm[] {
    const updated = getSavedRemittanceApprovals().filter(item => item.id !== id);
    try {
        localStorage.setItem(REMITTANCE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error deleting remittance approval:', e);
    }
    return updated;
}

export function formatRemittanceApprovalText(f: RemittanceApprovalForm): string {
    const totalStr = f.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(f.totalAmountRials))} ریال` : '......................................';
    const paidStr = f.paidAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(f.paidAmountRials))} ریال` : '................................';
    const remStr = f.remainingAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(f.remainingAmountRials))} ریال` : (f.totalAmountRials > 0 && f.paidAmountRials >= f.totalAmountRials ? '۰ ریال (تسویه کامل)' : '.................................');

    return `فرم تایید نهایی حواله – نمایندگی حسینی خودرو شیراز
شماره فرم: ${toPersianDigits(f.formNumber || '-')} | تاریخ: ${toPersianDigits(f.formDate || '-')}

1. مشخصات خودرو:
نوع خودرو: ${f.carModel || '……………………………………'}
رنگ: ${f.color || '………………………………………'}
زمان تحویل: ${toPersianDigits(f.deliveryTime) || '………………………………'}

2. اطلاعات مشتری:
نام و نام خانوادگی: ${f.customerName || '.............................'}
کدملی: ${toPersianDigits(f.customerNationalCode) || '......................................'}
شماره تماس: ${toPersianDigits(f.customerPhone) || '.................................'}

3. کنترل وضعیت مالی (مسئولیت کامل با حسابداری):
[${f.accCheckNoDebt ? '✓' : ' '}] هیچگونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است
[${f.accCheckMatched ? '✓' : ' '}] کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است
[${f.accCheckClear ? '✓' : ' '}] حواله خودرو از نظر مالی بلامانع است
مبلغ کل: ${totalStr}
مبلغ واریزی: ${paidStr}
مانده حساب: ${remStr}
نام مسئول حسابداری: ${f.accountingManagerName || '....................'}          امضا و تاریخ: ${toPersianDigits(f.accountingDate) || '....................'}

4. کنترل وضعیت فروش (مسئولیت کامل با مسئول فروش):
[${f.salesCheckCorrect ? '✓' : ' '}] اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است
[${f.salesCheckInvoice ? '✓' : ' '}] مبلغ فاکتور، تخفیف‌ها، شرایط فروش و مانده حساب کنترل شد
نام مسئول فروش: ${f.salesManagerName || '...........................'}          امضا و تاریخ: ${toPersianDigits(f.salesDate) || '....................'}
توضیحات: ${f.salesNotes || '..............................................'}

5. مدیریت تأیید می‌کند:
[${f.mgmtCheckSignatures ? '✓' : ' '}] تمامی امضاها کنترل
مسئولیت فروش با: ${f.salesResponsibilityWith || '......................................'}`;
}

// =========================================================================
// 3. قولنامه آزاد (Free-market Bill of Sale)
// =========================================================================

export const DEFAULT_FREE_BILL_OF_SALE: FreeBillOfSale = {
    id: '',
    contractNumber: '',
    contractDate: '',
    transactionTime: '',
    sellerTitle: 'آقای',
    sellerName: '',
    sellerFatherName: '',
    sellerIdNumber: '',
    sellerIssuePlace: '',
    sellerNationalCode: '',
    sellerAddress: '',
    sellerPostalCode: '',
    sellerPhone: '',
    buyerTitle: 'آقای',
    buyerName: '',
    buyerFatherName: '',
    buyerIdNumber: '',
    buyerIssuePlace: '',
    buyerNationalCode: '',
    buyerAddress: '',
    buyerPostalCode: '',
    buyerPhone: '',
    carModel: 'KMC eagle',
    chassisNumber: '',
    color: 'سفید',
    plateNumber: '',
    totalAmountRials: 0,
    totalAmountDescription: '',
    deliveredDocuments: '',
    status: 'DRAFT',
    createdAt: ''
};

export function generateFreeBillNumber(): string {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `1405/FB-${rand}`;
}

export function getSavedFreeBills(): FreeBillOfSale[] {
    try {
        const stored = localStorage.getItem(FREE_BILL_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('Error reading saved free bills:', e);
    }
    return [];
}

export function saveOrUpdateFreeBill(form: FreeBillOfSale): FreeBillOfSale[] {
    const current = getSavedFreeBills();
    const idx = current.findIndex(item => item.id === form.id);
    const nowIso = new Date().toISOString();
    const itemToSave: FreeBillOfSale = {
        ...form,
        id: form.id || `fb-${Date.now()}`,
        contractNumber: form.contractNumber || generateFreeBillNumber(),
        updatedAt: nowIso,
        createdAt: form.createdAt || nowIso
    };
    const updated = idx >= 0
        ? current.map((item, i) => (i === idx ? itemToSave : item))
        : [itemToSave, ...current];
    try {
        localStorage.setItem(FREE_BILL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error saving free bills:', e);
    }
    return updated;
}

export function deleteFreeBill(id: string): FreeBillOfSale[] {
    const updated = getSavedFreeBills().filter(item => item.id !== id);
    try {
        localStorage.setItem(FREE_BILL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error deleting free bill:', e);
    }
    return updated;
}

export function formatFreeBillText(f: FreeBillOfSale): string {
    const amountStr = f.totalAmountRials > 0
        ? `${toPersianDigits(formatCurrencyWithCommas(f.totalAmountRials))} ریال (${numberToPersianWords(f.totalAmountRials)} ریال)`
        : '....................................................................................';

    return `بسمه تعالی
قولنامه آزاد
شماره: ${toPersianDigits(f.contractNumber || '-')} | تاریخ: ${toPersianDigits(f.contractDate || '-')}

فروشنده: ${f.sellerTitle || 'خانم/آقای'} ${f.sellerName || '....................'}   فرزند: ${f.sellerFatherName || '..........'}   به شماره شناسنامه: ${toPersianDigits(f.sellerIdNumber) || '..........'}   صادره از: ${f.sellerIssuePlace || '..........'}   کد ملی: ${toPersianDigits(f.sellerNationalCode) || '....................'}
آدرس: ${f.sellerAddress || '..................................................'}
کد پستی: ${toPersianDigits(f.sellerPostalCode) || '..........'}   تلفن: ${toPersianDigits(f.sellerPhone) || '..........'}

خریدار: ${f.buyerTitle || 'خانم/آقای'} ${f.buyerName || '....................'}   فرزند: ${f.buyerFatherName || '..........'}   به شماره شناسنامه: ${toPersianDigits(f.buyerIdNumber) || '..........'}   صادره از: ${f.buyerIssuePlace || '..........'}   کد ملی: ${toPersianDigits(f.buyerNationalCode) || '....................'}
آدرس: ${f.buyerAddress || '..................................................'}
کدپستی: ${toPersianDigits(f.buyerPostalCode) || '..........'}   تلفن: ${toPersianDigits(f.buyerPhone) || '..........'}

مورد معامله: یکدستگاه خودروی ${f.carModel || '....................'} به شماره بدنه: ${f.chassisNumber || '....................'} به رنگ: ${f.color || '..........'} شماره شهربانی: ${f.plateNumber || '....................'}
مبلغ مورد معامله: ${amountStr}${f.totalAmountDescription ? `\nشرح پرداخت: ${f.totalAmountDescription}` : ''}

توضیحات: کلیه مخارج عوارض شهرداری و مالیات نقل و انتقال به عهده خریدار میباشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. فروشنده متعهد میگردد که ظرف مدت 10 روز در دفترخانه اسناد رسمی حاضر و وکالت تعویض پلاک را به نام خریدار تنظیم نماید در غیر اینصورت روزانه مبلغ 500 هزار تومان می بایست فروشنده به خریدار پرداخت نماید. خریدار نیز متعهد می گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک فروشنده را فک نماید. این معامله در تاریخ ${toPersianDigits(f.contractDate) || '..........'} و ساعت ${toPersianDigits(f.transactionTime) || '....:....'} بصورت قطعی انجام شد و حق فسخ ندارد. کشف فساد و خلافی تا این تاریخ به عهده فروشنده می باشد و از این تاریخ به بعد به عهده خریدار می باشد. خریدار از کم و کیف خودرو اطلاع داشته و خودرو صحیح و سالم به رویت کامل ایشان رسید. قیمت معامله براساس قیمت روز و شرایط وضعیت موجود بوده و خریدار با علم و اطلاع اقدام به خرید کرده اند و نوسانات قیمت هیچ گونه تاثیری در مبایعه نامه ندارد و هرگونه ادعائی در حال و آینده از خود سلب می نماید. فروشنده و خریدار با امضا ذیل مبایعه نامه از کلیه مفاد قرارداد و مبایعه نامه مطلع و آگاه شده اند و با اراده شخصی و با علم و آگاهی از کم و کیف خودرو مورد معامله و اوضاع و احوال و زمان و مکان و نیز رضایت از ثمن معامله بین طرفین منعقد گردید. تمام کافه خیارات بخصوص غبن فاحش و تدلیس از طرفین ساقط گردید. مرجع رسیدگی به هرگونه شکایت در خصوص این مبایعه نامه شهرستان شیراز می باشد. چنانچه خریدار ظرف مدت مقرر در وکالت، تعویض پلاک ننماید از زمان اتمام تاریخ وکالت اولیه تا تاریخ تعویض پلاک روزانه مبلغ 500 هزار تومان میبایست خریدار به فروشنده پرداخت نماید و هزینه وکالت مجدد با خریدار می باشد. تمامی مدارک خودرو اعم از ${f.deliveredDocuments || '..................................................'} تحویل خریدار گردید.

امضاء فروشنده                    امضاء خریدار                    امضاء شاهد`;
}
