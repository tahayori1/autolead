import type { CarPeaceContract } from '../types/bankLetter';
import { 
    formatCurrencyWithCommas, 
    numberToPersianWords, 
    toPersianDigits 
} from './bankLetterValidation';

const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';
const PEACE_CONTRACTS_STORAGE_KEY = 'autolead_car_peace_contracts_v1';

export const DEFAULT_PEACE_CONTRACT: CarPeaceContract = {
    id: '',
    contractNumber: '',
    contractDate: '',
    transactionTime: '',
    releasorName: 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی',
    releasorNationalId: '14012274787',
    releasorAddress: 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال',
    releasorPostalCode: '7173714734',
    releasorPhone: '09370518538',
    releaseeTitle: 'آقای',
    releaseeName: '',
    releaseeFatherName: '',
    releaseeIdNumber: '',
    releaseeIssuePlace: '',
    releaseeNationalCode: '',
    releaseeAddress: '',
    releaseePostalCode: '',
    releaseePhone: '',
    carModel: 'KMC eagle',
    chassisNumber: '',
    plateNumber: '',
    modelYear: '1405',
    color: 'سفید',
    totalAmountRials: 0,
    paidAmountRials: 0,
    trackingNumber: '',
    releaseeAccountNumber: '',
    releaseeShebaNumber: '',
    releaseeBankName: '',
    status: 'DRAFT',
    createdAt: ''
};

/**
 * Generate unique contract number
 */
export function generatePeaceContractNumber(): string {
    const year = '1405';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${year}/PC-${rand}`;
}

/**
 * Get saved peace contracts from localStorage (defaults to empty array)
 */
export function getSavedPeaceContracts(): CarPeaceContract[] {
    try {
        const stored = localStorage.getItem(PEACE_CONTRACTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Error reading saved peace contracts:', e);
    }
    return [];
}

/**
 * Save contracts to storage
 */
export function saveStoredPeaceContracts(contracts: CarPeaceContract[]): void {
    try {
        localStorage.setItem(PEACE_CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
    } catch (e) {
        console.warn('Error saving peace contracts to storage:', e);
    }
}

/**
 * Add or update peace contract
 */
export function saveOrUpdatePeaceContract(contract: CarPeaceContract): CarPeaceContract[] {
    const current = getSavedPeaceContracts();
    const existingIndex = current.findIndex(c => c.id === contract.id);
    let updatedList: CarPeaceContract[];

    const nowIso = new Date().toISOString();
    const contractToSave: CarPeaceContract = {
        ...contract,
        id: contract.id || `pc-${Date.now()}`,
        contractNumber: contract.contractNumber || generatePeaceContractNumber(),
        updatedAt: nowIso,
        createdAt: contract.createdAt || nowIso
    };

    if (existingIndex >= 0) {
        updatedList = [...current];
        updatedList[existingIndex] = contractToSave;
    } else {
        updatedList = [contractToSave, ...current];
    }

    saveStoredPeaceContracts(updatedList);
    syncPeaceContractToWebhook(contractToSave).catch(() => {});
    return updatedList;
}

/**
 * Delete a peace contract
 */
export function deletePeaceContract(id: string): CarPeaceContract[] {
    const current = getSavedPeaceContracts();
    const updated = current.filter(c => c.id !== id);
    saveStoredPeaceContracts(updated);
    return updated;
}

/**
 * Format the full exact official Peace Contract text according to the user's template
 */
export function formatPeaceContractText(c: CarPeaceContract): string {
    const totalAmountStr = c.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(c.totalAmountRials))} ریال (${numberToPersianWords(c.totalAmountRials)} ریال)` : '........................ ریال';
    const paidAmountStr = c.paidAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(c.paidAmountRials))} ریال` : (c.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(c.totalAmountRials))} ریال` : '........................');

    return `بسمه تعالی
قرارداد صلح خودرو
مصالح: ${c.releasorName || 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی'}
شناسه ملی: ${toPersianDigits(c.releasorNationalId || '14012274787')}        آدرس: ${c.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال'}
کد پستی:     ${toPersianDigits(c.releasorPostalCode || '7173714734')}  تلفن:  ${toPersianDigits(c.releasorPhone || '09370518538')}
متصالح: ${c.releaseeTitle || 'آقای/خانم'} ${c.releaseeName || '....................'}    فرزند : ${c.releaseeFatherName || '..........'}    به شماره شناسنامه : ${toPersianDigits(c.releaseeIdNumber) || '..........'}    صادره از : ${c.releaseeIssuePlace || '..........'}
کد ملی: ${toPersianDigits(c.releaseeNationalCode) || '..........'}    آدرس: ${c.releaseeAddress || '..................................................'}
کدپستی: ${toPersianDigits(c.releaseePostalCode) || '..........'}    تلفن: ${toPersianDigits(c.releaseePhone) || '..........'}
مورد صلح : یک دستگاه خودروی ${c.carModel || '..........'} به شماره شاسی ${c.chassisNumber || '....................'} به شماره پلاک انتظامی ${c.plateNumber || '....................'}
مدل ${toPersianDigits(c.modelYear) || '....'} رنگ: ${c.color || '..........'} به همراه کلیه متعلقات طبق چک لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.
مبلغ مورد صلح: ${totalAmountStr} که مبلغ ${paidAmountStr} به شماره پیگیری ${toPersianDigits(c.trackingNumber) || '....................'} واریز گردید.
توضیحات: کلیه مخارج انتقال سند و عوارض شهرداری و مالیات نقل و انتقال  به عهده متصالح میباشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. سند خودرو فوق پس از به نام خوردن به نام مصالح، در دفتر خانه اسناد رسمی به صورت وکالت تعویض پلاک به نام متصالح انتقال می یابد.متصالح نیز متعهد می گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک مصالح را فک نماید در غیر این صورت روزانه مبلغ 500 هزارتومان خسارت باید به مصالح پرداخت نماید.این معامله در تاریخ ${toPersianDigits(c.contractDate) || '....................'} وساعت ${toPersianDigits(c.transactionTime) || '....:....'} بصورت قطعی انجام شد حق فسخ وجود ندارد.ارتکاب هرگونه  خلافی از تاریخ تحویل خودرو به عهده متصالح می باشد. 
شروط و توضیحات :
 1--کلیه هزینه های قراردادی،مالیات ها،عوارض،بیمه شخص ثالث، مالیات ارزش افزوده و سایر هزینه هایی که قانون یا قرارداد پرداخت آن را به عهده متصالح و مصرف کننده گذاشته است،به عهده متصالح می باشد.بدیهی است نرخ های موارد فوق بر اساس قوانین و توافقات فعلی محاسبه شده است. 
2- متصالح در کمال صحت عقل و اختیار و به موجب مفاد این صلح نامه کافه خیارات خصوصا خیار غبن ولو فاحش به اعلي مرتبه ونیز هرگونه ادعایی نسبت به خودروی موضوع صلح را از جمله گرانفروشی و غیره و حق هرگونه دعوی و یا شکایت و اعتراض در هر یک از مراجع اداری ، انتظامی و قضایی از خود سلب و ساقط نمود.
3- مرجع رسیدگی به هرگونه شکایت یا دعوی در خصوص این قرارداد شهرستان شیراز می باشد.
4-در صورت بروز هرگونه اختلاف در تفسیر و یا تعبیر یا اجرای این قرارداد(صلحنامه) اعم از اجرای تعهدات،انحلال قرارداد(اقاله،فسخ،انفساخ،بطلان و ابطال و اتمام مدت)،آثار و تبعات و الزامات بعد از انحلال قرارداد، خسارات،تفسیر و غیره بدوا از طریق مذاکره حداکثر ظرف مدت 15 روز حل و فصل خواهد شد و در صورت عدم حصول نتیجه موضوع از طریق داور مرضی الطرفین آقای محمد شکرشکن به شماره ملی2298920087 با شناسه داوری98188 و عضو کانون داوران استان فارس رسیدگی و حل و فصل می گردد.مدت داوری سه ماه و با تشخیص داور مدت سه ماه دیگر نیز قابل افزایش است و رای داور برای طرفین و قائم مقام قانونی آنان لازم الاتباع است و شرط داوری مستقل از اعتبار و صحت و بقای قرارداد (صلحنامه) است.
5- اطلاعات حساب بانکی متصالح
شماره حساب ${toPersianDigits(c.releaseeAccountNumber) || '....................'} شماره شبا ${c.releaseeShebaNumber ? ('IR' + c.releaseeShebaNumber.replace(/^IR/i, '')) : '........................'} بانک ${c.releaseeBankName || '..........'} می باشد که پرداخت کلیه ثمن معامله صرفا از طریق حساب مذکور انجام خواهد شد.
6- تمامی مکاتبات و تماس و پیامک ها به آدرس و شماره همراه مذکور ابلاغ و اعلام می گردد.بدیهی است در صورت هرگونه تغییر در آدرس یا شماره تلفن همراه و اطلاعات حساب بانکی فوق الذکر متصالح موظف است ظرف مدت3 روز مراتب را کتبا به مصالح اعلام نماید.در غیر اینصورت مسئولیت آن متوجه متصالح می باشد.
7-تنظیم صورتجلسه تحویل خودرو به منزله تایید صحت و سلامت خودروی تحویل گرفته شده از سوی مصالح میباشد.با این وجود مسئولیت رفع هرگونه ایراد و یا نقص فنی خودرو و جبران خسارات به عهده مراجع و نمایندگی های مجاز خدمات پس از فروش شرکت کرمان موتور است و از این حیث هیچ مسئولیتی متوجه مصالح نیست.
8-این صلحنامه در تاریخ ${toPersianDigits(c.contractDate) || '....................'} طبق ماده10 قانون مدنی در دو نسخه  با متن و حکم و اعتبار واحد فی مابین  طرفین و امضا و مبادله شد و مفاد آن برای طرفین لازم الاتباع است.

اينجانب ${c.releaseeTitle || 'آقای/خانم'} ${c.releaseeName || '....................'} با مطالعه دقيق قرارداد فوق و علم و آگاهي كامل از مفاد آن با رضايت آنرا امضاء نمودم.




امضاء مصالح :                           امضا و اثر انگشت متصالح :                              امضا شهود:`;
}

/**
 * Webhook Sync
 */
export async function syncPeaceContractToWebhook(contract: CarPeaceContract): Promise<any> {
    try {
        const payload = {
            event: 'CAR_PEACE_CONTRACT_SAVED',
            timestamp: new Date().toISOString(),
            data: contract
        };
        const res = await fetch(`${API_BASE_URL}/contracts/peace`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Webhook responded with status ${res.status}`);
        return await res.json();
    } catch (err) {
        // Silently handle offline/mock
        return { success: true, localOnly: true };
    }
}
