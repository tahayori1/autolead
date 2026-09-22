import type { BankLetter, SavedBankAccount } from '../types/bankLetter';
import { formatCurrencyWithCommas, numberToPersianWords, toPersianDigits, validateIranianSheba } from './bankLetterValidation';

const BANK_LETTERS_STORAGE_KEY = 'autolead_bank_letters_v1';
const SAVED_ACCOUNTS_STORAGE_KEY = 'autolead_saved_bank_accounts_v1';

// Webhook endpoint
const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';

// Initial pre-configured seed accounts for Hosseini Khodro Shiraz
export const INITIAL_SAVED_ACCOUNTS: SavedBankAccount[] = [
    {
        id: 'acc-refah-hoseini',
        accountHolderName: 'شرکت حسینی خودرو شیراز',
        shebaNumber: '590130100000000358157511',
        bankName: 'بانک رفاه کارگران',
        bankCode: '013',
        accountType: 'COMPANY',
        branchName: 'شعبه مرکزی',
        isDefault: true,
        description: 'شماره شبای ۱ شرکت - حساب شرکتی بانک رفاه کارگران',
        createdAt: '1405/01/01'
    },
    {
        id: 'acc-sina-hoseini',
        accountHolderName: 'شرکت حسینی خودرو شیراز',
        shebaNumber: '610590038500438519385001',
        bankName: 'بانک سینا',
        bankCode: '059',
        accountType: 'COMPANY',
        branchName: 'شعبه شیراز',
        isDefault: false,
        description: 'شماره شبای ۲ شرکت - حساب شرکتی بانک سینا',
        createdAt: '1405/01/01'
    }
];

// Sample letters for instant demo & preset filling
export const SAMPLE_BANK_LETTERS: BankLetter[] = [
    {
        id: 'sample-letter-corporate',
        letterNumber: '1405/KM2606/2041',
        letterDate: '1405/06/15',
        letterType: 'CORPORATE',
        destinationBankName: 'بانک ملی',
        destinationBranchName: 'شعبه مرکزی شیراز',
        customerTitle: 'خانم',
        customerName: 'نوش آفرین گورنگی',
        customerNationalCode: '2291545914',
        amountRials: 25000000000,
        amountWords: 'بیست و پنج میلیارد ریال',
        paymentMethod: 'بصورت حواله ساتنا',
        shebaNumber: '590130100000000358157511',
        beneficiaryBankName: 'بانک رفاه کارگران',
        accountHolderName: 'شرکت حسینی خودرو شیراز',
        accountHolderType: 'COMPANY',
        carModel: 'KMC eagle',
        carModelYear: '1405',
        carColor: 'سفید',
        dealershipName: 'نمایندگی کرمان موتور 2606',
        signatoryTitle: 'مدیریت نمایندگی ۲۶۰۶ کرمان موتور (شرکت حسینی خودرو شیراز)',
        status: 'ISSUED',
        createdAt: new Date().toISOString()
    },
    {
        id: 'sample-letter-personal',
        letterNumber: '1405/KM2606/2042',
        letterDate: '1405/06/18',
        letterType: 'PERSONAL',
        destinationBankName: 'بانک ملت',
        destinationBranchName: 'شعبه شیراز',
        customerTitle: 'خانم',
        customerName: 'زهرا غفاریان',
        customerNationalCode: '2295883407',
        amountRials: 6390000000,
        amountWords: 'شش میلیارد و سیصد و نود میلیون ریال',
        paymentMethod: 'بصورت حواله ساتنا',
        shebaNumber: '850120020000000296132589',
        beneficiaryBankName: 'بانک ملت',
        accountHolderName: 'امیر رضا محمدی پیراهی',
        accountHolderType: 'INDIVIDUAL',
        carModel: 'BAC X3 pro',
        carModelYear: '1405',
        carColor: 'سفید',
        dealershipName: 'نمایندگی 2606 کرمان موتور',
        signatoryTitle: 'مدیریت نمایندگی ۲۶۰۶ کرمان موتور',
        status: 'ISSUED',
        createdAt: new Date().toISOString()
    }
];

// Helper to get current Persian date
export function getCurrentPersianDate(): string {
    try {
        const d = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const parts = formatter.format(d).split('/');
        if (parts.length === 3) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
    } catch {
        // Fallback
    }
    return '1405/06/22';
}

// Generate unique letter tracking number
export function generateLetterNumber(): string {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `1405/KM2606/${randomSeq}`;
}

// --- Accounts Storage API ---
export function getSavedBankAccounts(): SavedBankAccount[] {
    try {
        const stored = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Error reading saved bank accounts from localStorage:', e);
    }
    // Save initial accounts if not present
    saveSavedBankAccounts(INITIAL_SAVED_ACCOUNTS);
    return INITIAL_SAVED_ACCOUNTS;
}

export function saveSavedBankAccounts(accounts: SavedBankAccount[]): void {
    try {
        localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
        console.warn('Error saving bank accounts to localStorage:', e);
    }
}

export function addOrUpdateBankAccount(account: Omit<SavedBankAccount, 'id'> & { id?: string }): SavedBankAccount[] {
    const current = getSavedBankAccounts();
    const cleanSheba = account.shebaNumber.replace(/\D/g, '');
    const shebaVal = validateIranianSheba(cleanSheba);
    
    const bankName = account.bankName || shebaVal.bankInfo?.name || 'بانک نامشخص';
    const bankCode = shebaVal.bankInfo?.code || '000';

    const newAccount: SavedBankAccount = {
        id: account.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        accountHolderName: account.accountHolderName.trim(),
        shebaNumber: cleanSheba,
        bankName,
        bankCode,
        accountType: account.accountType,
        branchName: account.branchName?.trim() || '',
        isDefault: Boolean(account.isDefault),
        description: account.description?.trim() || '',
        createdAt: account.createdAt || getCurrentPersianDate()
    };

    let updated: SavedBankAccount[];
    if (account.id && current.some(a => a.id === account.id)) {
        updated = current.map(a => a.id === account.id ? newAccount : (newAccount.isDefault ? { ...a, isDefault: false } : a));
    } else {
        if (newAccount.isDefault) {
            updated = [newAccount, ...current.map(a => ({ ...a, isDefault: false }))];
        } else {
            updated = [newAccount, ...current];
        }
    }

    saveSavedBankAccounts(updated);
    return updated;
}

export function deleteBankAccount(id: string): SavedBankAccount[] {
    const current = getSavedBankAccounts();
    const updated = current.filter(a => a.id !== id);
    saveSavedBankAccounts(updated);
    return updated;
}

// --- Letters Storage API ---
export function getSavedBankLetters(): BankLetter[] {
    try {
        const stored = localStorage.getItem(BANK_LETTERS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Error reading saved bank letters:', e);
    }
    return [];
}

export function saveStoredBankLetters(letters: BankLetter[]): void {
    try {
        localStorage.setItem(BANK_LETTERS_STORAGE_KEY, JSON.stringify(letters));
    } catch (e) {
        console.warn('Error saving bank letters to localStorage:', e);
    }
}

export function saveOrUpdateBankLetter(letter: BankLetter): BankLetter[] {
    const current = getSavedBankLetters();
    const existingIndex = current.findIndex(l => l.id === letter.id);
    
    let updated: BankLetter[];
    if (existingIndex >= 0) {
        updated = current.map(l => l.id === letter.id ? { ...letter, updatedAt: new Date().toISOString() } : l);
    } else {
        updated = [{ ...letter, createdAt: new Date().toISOString() }, ...current];
    }

    saveStoredBankLetters(updated);

    // Also fire webhook async in background
    syncBankLetterToWebhook(letter).catch(err => console.warn('Webhook letter sync notice:', err));

    return updated;
}

export function deleteBankLetter(id: string): BankLetter[] {
    const current = getSavedBankLetters();
    const updated = current.filter(l => l.id !== id);
    saveStoredBankLetters(updated);
    return updated;
}

// Format the exact official letter text
export function formatOfficialLetterText(letter: BankLetter): string {
    const formattedAmount = formatCurrencyWithCommas(letter.amountRials);
    const wordsAmount = letter.amountWords || (numberToPersianWords(letter.amountRials) + ' ریال');
    const branchText = letter.destinationBranchName ? ` ${letter.destinationBranchName}` : '';
    const colorText = letter.carColor ? ` به رنگ ${letter.carColor}` : '';
    const yearText = letter.carModelYear ? ` مدل ${letter.carModelYear}` : '';
    
    return `بنام خدا

ریاست محترم ${letter.destinationBankName}${branchText}
با سلام
احتراماً ${letter.customerTitle} ${letter.customerName} به کدملی ${letter.customerNationalCode} جهت امور بانکی و واریز وجه به مبلغ ${formattedAmount} ریال (${wordsAmount}) ${letter.paymentMethod || 'بصورت حواله ساتنا'} به شماره شبا ${letter.shebaNumber} ${letter.beneficiaryBankName} بنام ${letter.accountHolderName} جهت خرید یک دستگاه ${letter.carModel}${yearText}${colorText} به خدمت حضورتان معرفی می گردند.
خواهشمند است بذل لطف نموده همکاری های لازم با نامبرده را مبذول فرمایید.

با تشکر
${letter.dealershipName || 'نمایندگی کرمان موتور ۲۶۰۶'}
تاریخ: ${letter.letterDate}
شماره: ${letter.letterNumber}`;
}

// Webhook persistence
export async function syncBankLetterToWebhook(letter: BankLetter): Promise<any> {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
            action: 'SAVE_BANK_LETTER',
            letterId: letter.id,
            letterNumber: letter.letterNumber,
            letterDate: letter.letterDate,
            letterType: letter.letterType,
            customerName: letter.customerName,
            customerNationalCode: letter.customerNationalCode,
            amountRials: letter.amountRials,
            shebaNumber: letter.shebaNumber,
            accountHolderName: letter.accountHolderName,
            carModel: letter.carModel,
            timestamp: new Date().toISOString(),
            fullLetter: letter
        };

        const response = await fetch(`${API_BASE_URL}/bank-letters`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        return await response.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
        console.warn('Could not post bank letter to webhook:', e);
        return { status: 'fallback_saved' };
    }
}
